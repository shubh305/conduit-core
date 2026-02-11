import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { ReadingList, ReadingListDocument } from "./schemas/reading-list.schema";
import { CreateListDto, UpdateListDto } from "./dto/lists.dto";

@Injectable()
export class ListsService {
  constructor(
    @InjectModel(ReadingList.name)
    private readingListModel: Model<ReadingListDocument>,
  ) {}

  async create(userId: string, createListDto: CreateListDto): Promise<ReadingListDocument> {
    const newList = new this.readingListModel({
      ...createListDto,
      userId,
    });
    return newList.save();
  }

  async findAll(userId: string): Promise<ReadingListDocument[]> {
    return this.readingListModel.find({ userId }).sort({ createdAt: -1 }).exec();
  }

  async findOne(id: string, userId: string): Promise<ReadingListDocument> {
    const list = await this.readingListModel.findOne({ _id: id, userId }).exec();
    if (!list) {
      throw new NotFoundException(`List with ID ${id} not found`);
    }
    return list;
  }

  async update(id: string, userId: string, updateListDto: UpdateListDto): Promise<ReadingListDocument> {
    if (updateListDto.isSystem) {
      await this.readingListModel.updateMany({ userId, _id: { $ne: id } }, { isSystem: false }).exec();
    }

    const updatedList = await this.readingListModel
      .findOneAndUpdate({ _id: id, userId }, updateListDto, { new: true })
      .exec();

    if (!updatedList) {
      throw new NotFoundException(`List with ID ${id} not found`);
    }
    return updatedList;
  }

  async delete(id: string, userId: string): Promise<void> {
    const result = await this.readingListModel.deleteOne({ _id: id, userId }).exec();
    if (result.deletedCount === 0) {
      throw new NotFoundException(`List with ID ${id} not found`);
    }
  }

  async addItem(id: string, userId: string, postId: string): Promise<ReadingListDocument> {
    const list = await this.findOne(id, userId);

    const exists = list.items.some(item => item.postId === postId);
    if (exists) {
      return list;
    }

    list.items.push({ postId, addedAt: new Date() });
    return list.save();
  }

  async removeItem(id: string, userId: string, postId: string): Promise<ReadingListDocument> {
    const list = await this.findOne(id, userId);
    list.items = list.items.filter(item => item.postId !== postId);
    return list.save();
  }

  async checkPostInLists(userId: string, postId: string): Promise<string[]> {
    const lists = await this.readingListModel
      .find({
        userId,
        "items.postId": postId,
      })
      .select("_id")
      .exec();

    return lists.map(list => list._id.toString());
  }

  async ensureDefaultList(userId: string): Promise<ReadingListDocument> {
    let defaultList: ReadingListDocument | null = await this.readingListModel
      .findOne({ userId, isSystem: true })
      .exec();

    if (!defaultList) {
      defaultList = await this.readingListModel.findOne({ userId, name: "Reading list" }).exec();
    }

    if (!defaultList) {
      defaultList = await this.create(userId, {
        name: "Reading list",
        isPrivate: true,
      });
    }
    return defaultList;
  }
}
