/*
  Warnings:

  - You are about to drop the column `location` on the `PalletTemp` table. All the data in the column will be lost.
  - Added the required column `mapAreaRackId` to the `PalletTemp` table without a default value. This is not possible if the table is not empty.

*/
BEGIN TRY

BEGIN TRAN;

-- AlterTable
ALTER TABLE [dbo].[PalletTemp] DROP COLUMN [location];
ALTER TABLE [dbo].[PalletTemp] ADD [mapAreaRackId] INT NOT NULL;

-- AddForeignKey
ALTER TABLE [dbo].[PalletTemp] ADD CONSTRAINT [PalletTemp_mapAreaRackId_fkey] FOREIGN KEY ([mapAreaRackId]) REFERENCES [dbo].[MapAreaRack]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
