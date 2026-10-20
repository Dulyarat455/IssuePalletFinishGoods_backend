/*
  Warnings:

  - You are about to drop the column `EndAreaId` on the `LocMovePallet` table. All the data in the column will be lost.
  - You are about to drop the column `StartAreaId` on the `LocMovePallet` table. All the data in the column will be lost.
  - Added the required column `endAreaId` to the `LocMovePallet` table without a default value. This is not possible if the table is not empty.
  - Added the required column `startAreaId` to the `LocMovePallet` table without a default value. This is not possible if the table is not empty.

*/
BEGIN TRY

BEGIN TRAN;

-- AlterTable
ALTER TABLE [dbo].[LocMovePallet] DROP COLUMN [EndAreaId],
[StartAreaId];
ALTER TABLE [dbo].[LocMovePallet] ADD [endAreaId] INT NOT NULL,
[startAreaId] INT NOT NULL;

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
