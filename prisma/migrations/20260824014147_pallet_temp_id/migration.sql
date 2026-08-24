/*
  Warnings:

  - Added the required column `palletTempId` to the `HeaderIssueTemp` table without a default value. This is not possible if the table is not empty.

*/
BEGIN TRY

BEGIN TRAN;

-- AlterTable
ALTER TABLE [dbo].[HeaderIssueTemp] ADD [palletTempId] INT NOT NULL;

-- CreateTable
CREATE TABLE [dbo].[PalletTemp] (
    [id] INT NOT NULL IDENTITY(1,1),
    [date] DATETIME2 NOT NULL,
    [shift] NVARCHAR(1000) NOT NULL,
    [location] NVARCHAR(1000) NOT NULL,
    [labelType] NVARCHAR(1000) NOT NULL,
    [timeStmp] DATETIME2 NOT NULL CONSTRAINT [PalletTemp_timeStmp_df] DEFAULT CURRENT_TIMESTAMP,
    [status] NVARCHAR(1000) NOT NULL CONSTRAINT [PalletTemp_status_df] DEFAULT 'use',
    CONSTRAINT [PalletTemp_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- AddForeignKey
ALTER TABLE [dbo].[HeaderIssueTemp] ADD CONSTRAINT [HeaderIssueTemp_palletTempId_fkey] FOREIGN KEY ([palletTempId]) REFERENCES [dbo].[PalletTemp]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
