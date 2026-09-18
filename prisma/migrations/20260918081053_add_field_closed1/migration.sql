/*
  Warnings:

  - Added the required column `palletId` to the `HeaderClosedTemp` table without a default value. This is not possible if the table is not empty.

*/
BEGIN TRY

BEGIN TRAN;

-- AlterTable
ALTER TABLE [dbo].[HeaderClosedTemp] ADD [palletId] INT NOT NULL;

-- AlterTable
ALTER TABLE [dbo].[Pallet] ADD [closedState] NVARCHAR(1000);

-- CreateTable
CREATE TABLE [dbo].[HeaderBoxClosed] (
    [id] INT NOT NULL IDENTITY(1,1),
    [headerClosedId] INT NOT NULL,
    [boxId] INT NOT NULL,
    [headId] INT NOT NULL,
    [palletId] INT NOT NULL,
    [userId] INT NOT NULL,
    [timeStmp] DATETIME2 NOT NULL CONSTRAINT [HeaderBoxClosed_timeStmp_df] DEFAULT CURRENT_TIMESTAMP,
    [status] NVARCHAR(1000) NOT NULL CONSTRAINT [HeaderBoxClosed_status_df] DEFAULT 'use',
    CONSTRAINT [HeaderBoxClosed_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- AddForeignKey
ALTER TABLE [dbo].[HeaderClosedTemp] ADD CONSTRAINT [HeaderClosedTemp_palletId_fkey] FOREIGN KEY ([palletId]) REFERENCES [dbo].[Pallet]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[HeaderBoxClosed] ADD CONSTRAINT [HeaderBoxClosed_boxId_fkey] FOREIGN KEY ([boxId]) REFERENCES [dbo].[Box]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[HeaderBoxClosed] ADD CONSTRAINT [HeaderBoxClosed_headId_fkey] FOREIGN KEY ([headId]) REFERENCES [dbo].[HeaderIssue]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[HeaderBoxClosed] ADD CONSTRAINT [HeaderBoxClosed_userId_fkey] FOREIGN KEY ([userId]) REFERENCES [dbo].[User]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[HeaderBoxClosed] ADD CONSTRAINT [HeaderBoxClosed_palletId_fkey] FOREIGN KEY ([palletId]) REFERENCES [dbo].[Pallet]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
