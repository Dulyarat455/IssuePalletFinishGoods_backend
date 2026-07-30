/*
  Warnings:

  - You are about to drop the column `dieNo` on the `PartMaster` table. All the data in the column will be lost.
  - You are about to drop the column `dwg` on the `PartMaster` table. All the data in the column will be lost.
  - You are about to drop the column `qty` on the `PartMaster` table. All the data in the column will be lost.

*/
BEGIN TRY

BEGIN TRAN;

-- AlterTable
ALTER TABLE [dbo].[PartMaster] DROP COLUMN [dieNo],
[dwg],
[qty];

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
