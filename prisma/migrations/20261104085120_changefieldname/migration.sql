/*
  Warnings:

  - You are about to drop the column `mapSpecialCodeModelId` on the `HeaderIssue` table. All the data in the column will be lost.
  - You are about to drop the column `mapSpecialCodeModelId` on the `HeaderIssueTemp` table. All the data in the column will be lost.
  - You are about to drop the column `mapSpecialCodeModelId` on the `HeaderIssueTempTAC` table. All the data in the column will be lost.

*/
BEGIN TRY

BEGIN TRAN;

-- AlterTable
ALTER TABLE [dbo].[HeaderIssue] DROP COLUMN [mapSpecialCodeModelId];
ALTER TABLE [dbo].[HeaderIssue] ADD [specialCode] NVARCHAR(1000);

-- AlterTable
ALTER TABLE [dbo].[HeaderIssueTemp] DROP COLUMN [mapSpecialCodeModelId];
ALTER TABLE [dbo].[HeaderIssueTemp] ADD [specialCode] NVARCHAR(1000);

-- AlterTable
ALTER TABLE [dbo].[HeaderIssueTempTAC] DROP COLUMN [mapSpecialCodeModelId];
ALTER TABLE [dbo].[HeaderIssueTempTAC] ADD [specialCode] NVARCHAR(1000);

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
