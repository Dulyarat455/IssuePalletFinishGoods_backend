/*
  Warnings:

  - You are about to drop the column `controlLotId` on the `HeaderIssue` table. All the data in the column will be lost.
  - You are about to drop the column `dateIssue` on the `HeaderIssue` table. All the data in the column will be lost.
  - You are about to drop the column `idPallet` on the `HeaderIssue` table. All the data in the column will be lost.
  - You are about to drop the column `locationId` on the `HeaderIssue` table. All the data in the column will be lost.
  - You are about to drop the column `qtyBox` on the `HeaderIssue` table. All the data in the column will be lost.
  - You are about to drop the column `shift` on the `HeaderIssue` table. All the data in the column will be lost.
  - You are about to drop the column `totalBox` on the `HeaderIssue` table. All the data in the column will be lost.
  - You are about to drop the column `headerFractionId` on the `MapHeaderIssueFraction` table. All the data in the column will be lost.
  - Added the required column `controlLot` to the `HeaderIssue` table without a default value. This is not possible if the table is not empty.
  - Added the required column `fractionQty` to the `HeaderIssue` table without a default value. This is not possible if the table is not empty.
  - Added the required column `palletId` to the `HeaderIssue` table without a default value. This is not possible if the table is not empty.

*/
BEGIN TRY

BEGIN TRAN;

-- DropForeignKey
ALTER TABLE [dbo].[HeaderIssueFraction] DROP CONSTRAINT [HeaderIssueFraction_headerId_fkey];

-- DropForeignKey
ALTER TABLE [dbo].[MapHeaderIssueFraction] DROP CONSTRAINT [MapHeaderIssueFraction_headerFractionId_fkey];

-- DropForeignKey
ALTER TABLE [dbo].[MapHeaderIssueFraction] DROP CONSTRAINT [MapHeaderIssueFraction_headerId_fkey];

-- AlterTable
ALTER TABLE [dbo].[HeaderIssue] DROP COLUMN [controlLotId],
[dateIssue],
[idPallet],
[locationId],
[qtyBox],
[shift],
[totalBox];
ALTER TABLE [dbo].[HeaderIssue] ADD [controlLot] NVARCHAR(1000) NOT NULL,
[fractionQty] INT NOT NULL,
[palletId] INT NOT NULL;

-- AlterTable
ALTER TABLE [dbo].[MapHeaderIssueFraction] DROP COLUMN [headerFractionId];

-- CreateTable
CREATE TABLE [dbo].[Pallet] (
    [id] INT NOT NULL IDENTITY(1,1),
    [PalletNoId] INT NOT NULL,
    [date] DATETIME2 NOT NULL,
    [shift] NVARCHAR(1000) NOT NULL,
    [mapAreaRackId] INT NOT NULL,
    [labelType] NVARCHAR(1000) NOT NULL,
    [userId] INT NOT NULL,
    [timeStmp] DATETIME2 NOT NULL CONSTRAINT [Pallet_timeStmp_df] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [Pallet_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- AddForeignKey
ALTER TABLE [dbo].[Pallet] ADD CONSTRAINT [Pallet_userId_fkey] FOREIGN KEY ([userId]) REFERENCES [dbo].[User]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[Pallet] ADD CONSTRAINT [Pallet_mapAreaRackId_fkey] FOREIGN KEY ([mapAreaRackId]) REFERENCES [dbo].[MapAreaRack]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[HeaderIssue] ADD CONSTRAINT [HeaderIssue_userId_fkey] FOREIGN KEY ([userId]) REFERENCES [dbo].[Pallet]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[MapHeaderIssueFraction] ADD CONSTRAINT [MapHeaderIssueFraction_headerId_fkey] FOREIGN KEY ([headerId]) REFERENCES [dbo].[HeaderIssue]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[MapHeaderIssueFraction] ADD CONSTRAINT [MapHeaderIssueFraction_boxId_fkey] FOREIGN KEY ([boxId]) REFERENCES [dbo].[Box]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
