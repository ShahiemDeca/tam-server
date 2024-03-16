import { Db } from 'mongodb'
import { MigrationInterface } from 'mongo-migrate-ts';

export class Migration1710182919698 implements MigrationInterface {
  public async up(db: Db): Promise<any> {
    db.createCollection('mycol');
  }

  public async down(db: Db): Promise<any> {
db.dropCollection('mycol');
  }
}
