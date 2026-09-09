/*
  Warnings:

  - You are about to drop the column `PalletNoId` on the `Pallet` table. All the data in the column will be lost.
  - Added the required column `palletNoId` to the `Pallet` table without a default value. This is not possible if the table is not empty.

*/
BEGIN TRY

BEGIN TRAN;

-- AlterTable
ALTER TABLE [dbo].[Pallet] DROP COLUMN [PalletNoId];
ALTER TABLE [dbo].[Pallet] ADD [palletNoId] NVARCHAR(1000) NOT NULL;

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
