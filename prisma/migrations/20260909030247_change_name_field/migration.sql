/*
  Warnings:

  - You are about to drop the column `headClosedId` on the `Box` table. All the data in the column will be lost.
  - You are about to drop the column `headId` on the `Box` table. All the data in the column will be lost.
  - Added the required column `headerId` to the `Box` table without a default value. This is not possible if the table is not empty.

*/
BEGIN TRY

BEGIN TRAN;

-- DropForeignKey
ALTER TABLE [dbo].[Box] DROP CONSTRAINT [Box_headId_fkey];

-- AlterTable
ALTER TABLE [dbo].[Box] DROP COLUMN [headClosedId],
[headId];
ALTER TABLE [dbo].[Box] ADD [headerClosedId] INT,
[headerId] INT NOT NULL;

-- AddForeignKey
ALTER TABLE [dbo].[Box] ADD CONSTRAINT [Box_headerId_fkey] FOREIGN KEY ([headerId]) REFERENCES [dbo].[HeaderIssue]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
