import { Injectable, OnModuleDestroy, OnModuleInit } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import * as mongoose from "mongoose";
import { Connection } from "mongoose";

@Injectable()
export class DatabaseService implements OnModuleInit, OnModuleDestroy {
  private connections: Map<string, Connection> = new Map();
  private masterConnection: Connection;

  constructor(private configService: ConfigService) {}

  async onModuleInit() {
    await this.getMasterConnection();
  }

  async onModuleDestroy() {
    await this.masterConnection?.close();
    for (const connection of this.connections.values()) {
      await connection.close();
    }
  }

  async getMasterConnection(): Promise<Connection> {
    if (!this.masterConnection) {
      const uri = this.configService.get<string>("MONGO_URI");
      const dbName =
        this.configService.get<string>("MONGO_DB_NAME") || "conduit_master";
      this.masterConnection = await mongoose
        .createConnection(uri, {
          dbName,
        })
        .asPromise();
    }
    return this.masterConnection;
  }

  async getTenantConnection(databaseName: string): Promise<Connection> {
    if (this.connections.has(databaseName)) {
      return this.connections.get(databaseName)!;
    }

    const uri = this.configService.get<string>("MONGO_URI");
    if (!databaseName.startsWith("conduit_tenant_")) {
      throw new Error(`Invalid tenant database name: ${databaseName}`);
    }

    const connection = await mongoose
      .createConnection(uri, {
        dbName: databaseName,
      })
      .asPromise();
    this.connections.set(databaseName, connection);

    return connection;
  }

  async createTenantDatabase(tenantId: string): Promise<string> {
    const databaseName = `conduit_tenant_${tenantId}`;
    await this.getTenantConnection(databaseName);
    return databaseName;
  }

  async dropTenantDatabase(tenantId: string): Promise<void> {
    const databaseName = `conduit_tenant_${tenantId}`;
    const connection = await this.getTenantConnection(databaseName);
    await connection.dropDatabase();
    this.connections.delete(databaseName);
    await connection.close();
  }
}
