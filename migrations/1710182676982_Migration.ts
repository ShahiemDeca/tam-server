import { Db } from 'mongodb'
import { MigrationInterface } from 'mongo-migrate-ts';
import { UserRoleModel } from '../src/models/UserRole';
import { RoleModel } from '../src/models/Role';

export class Migration1710182676982 implements MigrationInterface {
  public async up(db: Db): Promise<any> {
    try {
      // Create roles
      const adminRole = await RoleModel.create({ name: 'admin' });
      const moderatorRole = await RoleModel.create({ name: 'moderator' });

      // Create user roles
      const userRoleId = adminRole._id; // Assuming admin role ID
      const userId = 1; // Replace with an actual user ID
      await UserRoleModel.create({ userId, roleId: userRoleId });

      console.log('Migration successful');
    } catch (error) {
      console.error('Error in migration:', error);
    }
  }

  public async down(db: Db): Promise<any> {
    try {
      // Remove roles, permissions, and user roles
      await RoleModel.deleteMany({ name: { $in: ['admin', 'moderator'] } });
      await UserRoleModel.deleteMany({});

      console.log('Rollback successful');
    } catch (error) {
      console.error('Error in rollback:', error);
    }
  }
}
