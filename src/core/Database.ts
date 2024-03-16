import mongoose, { ConnectOptions, Mongoose } from 'mongoose';

export default class Database {
  private static instance: Database;
  private mongooseInstance: Mongoose;

  private constructor(private dbConfig: ConnectOptions) {
    this.mongooseInstance = mongoose;
  }

  static getInstance(dbConfig: ConnectOptions): Database {
    if (!Database.instance) {
      Database.instance = new Database(dbConfig);
    }
    return Database.instance;
  }

  async connect(): Promise<void> {
    try {
      await this.mongooseInstance.connect('mongodb://localhost:27017', this.dbConfig);
      console.log('Connected to MongoDB');
    } catch (error) {
      console.error('Error connecting to MongoDB:', error);
    }
  }

  disconnect(): void {
    this.mongooseInstance.disconnect();
    console.log('Disconnected from MongoDB');
  }
}