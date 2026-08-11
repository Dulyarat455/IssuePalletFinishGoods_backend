/*
  Warnings:

  - You are about to drop the column `normalQty` on the `BoxIssueTemp` table. All the data in the column will be lost.

*/
BEGIN TRY

BEGIN TRAN;

-- AlterTable
ALTER TABLE [dbo].[BoxIssueTemp] DROP COLUMN [normalQty];

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
