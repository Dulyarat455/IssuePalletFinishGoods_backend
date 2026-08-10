/*
  Warnings:

  - Added the required column `headerFractionId` to the `MapHeaderIssueFraction` table without a default value. This is not possible if the table is not empty.
  - Added the required column `headerFractionId` to the `MapHeaderIssueTempFraction` table without a default value. This is not possible if the table is not empty.

*/
BEGIN TRY

BEGIN TRAN;

-- AlterTable
ALTER TABLE [dbo].[MapHeaderIssueFraction] ADD [headerFractionId] INT NOT NULL;

-- AlterTable
ALTER TABLE [dbo].[MapHeaderIssueTempFraction] ADD [headerFractionId] INT NOT NULL;

-- CreateTable
CREATE TABLE [dbo].[HeaderIssueTempFraction] (
    [id] INT NOT NULL IDENTITY(1,1),
    [qtyBox] INT NOT NULL,
    [totalBox] INT NOT NULL,
    [timeStmp] DATETIME2 NOT NULL CONSTRAINT [HeaderIssueTempFraction_timeStmp_df] DEFAULT CURRENT_TIMESTAMP,
    [status] NVARCHAR(1000) NOT NULL CONSTRAINT [HeaderIssueTempFraction_status_df] DEFAULT 'use',
    CONSTRAINT [HeaderIssueTempFraction_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[HeaderIssueFraction] (
    [id] INT NOT NULL IDENTITY(1,1),
    [qtyBox] INT NOT NULL,
    [totalBox] INT NOT NULL,
    [timeStmp] DATETIME2 NOT NULL CONSTRAINT [HeaderIssueFraction_timeStmp_df] DEFAULT CURRENT_TIMESTAMP,
    [status] NVARCHAR(1000) NOT NULL CONSTRAINT [HeaderIssueFraction_status_df] DEFAULT 'use',
    CONSTRAINT [HeaderIssueFraction_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- AddForeignKey
ALTER TABLE [dbo].[MapHeaderIssueTempFraction] ADD CONSTRAINT [MapHeaderIssueTempFraction_headerFractionId_fkey] FOREIGN KEY ([headerFractionId]) REFERENCES [dbo].[HeaderIssueTempFraction]([id]) ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[MapHeaderIssueFraction] ADD CONSTRAINT [MapHeaderIssueFraction_headerFractionId_fkey] FOREIGN KEY ([headerFractionId]) REFERENCES [dbo].[HeaderIssueFraction]([id]) ON DELETE NO ACTION ON UPDATE CASCADE;

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
