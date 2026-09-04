/*
  Warnings:

  - You are about to drop the column `controlLotId` on the `HeaderIssueTemp` table. All the data in the column will be lost.
  - Added the required column `controlLot` to the `HeaderIssueTemp` table without a default value. This is not possible if the table is not empty.

*/
BEGIN TRY

BEGIN TRAN;

-- AlterTable
ALTER TABLE [dbo].[HeaderIssueTemp] DROP COLUMN [controlLotId];
ALTER TABLE [dbo].[HeaderIssueTemp] ADD [controlLot] NVARCHAR(1000) NOT NULL;

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
