import { Controller, Get, Param, Post, Body } from "@nestjs/common";
import { DictionaryService } from "./dictionary.service";
import { DictionaryEntry } from "./dictionary.interfaces";

@Controller("dictionary")
export class DictionaryController {
  constructor(private readonly dictionaryService: DictionaryService) {}

  @Get(":word")
  async lookup(@Param("word") word: string): Promise<DictionaryEntry[]> {
    return this.dictionaryService.lookup(word);
  }

  @Post("lookup")
  async lookupWithReading(@Body() body: { word: string; reading?: string }): Promise<DictionaryEntry[]> {
    return this.dictionaryService.lookup(body.word, body.reading);
  }
}
