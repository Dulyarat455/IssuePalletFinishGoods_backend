BEGIN TRY

BEGIN TRAN;

-- CreateTable
CREATE TABLE [dbo].[HeaderIssueTempTAC] (
    [id] INT NOT NULL IDENTITY(1,1),
    [palletId] INT NOT NULL,
    [itemNo] NVARCHAR(1000) NOT NULL,
    [itemName] NVARCHAR(1000) NOT NULL,
    [normalQty] INT NOT NULL,
    [fractionQty] INT NOT NULL,
    [groupId] INT NOT NULL,
    [controlLot] NVARCHAR(1000) NOT NULL,
    [moveMentThreeMonth] NVARCHAR(1000) NOT NULL,
    [userId] INT NOT NULL,
    [timeStmp] DATETIME2 NOT NULL CONSTRAINT [HeaderIssueTempTAC_timeStmp_df] DEFAULT CURRENT_TIMESTAMP,
    [status] NVARCHAR(1000) NOT NULL CONSTRAINT [HeaderIssueTempTAC_status_df] DEFAULT 'use',
    CONSTRAINT [HeaderIssueTempTAC_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[BoxTAC] (
    [id] INT NOT NULL IDENTITY(1,1),
    [headerId] INT NOT NULL,
    [itemNo] NVARCHAR(1000) NOT NULL,
    [itemName] NVARCHAR(1000) NOT NULL,
    [wosNo] NVARCHAR(1000) NOT NULL,
    [dwg] NVARCHAR(1000) NOT NULL,
    [dieNo] NVARCHAR(1000) NOT NULL,
    [lotNo] NVARCHAR(1000) NOT NULL,
    [qty] INT NOT NULL,
    [timeStmp] DATETIME2 NOT NULL CONSTRAINT [BoxTAC_timeStmp_df] DEFAULT CURRENT_TIMESTAMP,
    [status] NVARCHAR(1000) NOT NULL CONSTRAINT [BoxTAC_status_df] DEFAULT 'use',
    CONSTRAINT [BoxTAC_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[MapHeaderIssueFractionTAC] (
    [id] INT NOT NULL IDENTITY(1,1),
    [headerId] INT NOT NULL,
    [boxId] INT NOT NULL,
    [timeStmp] DATETIME2 NOT NULL CONSTRAINT [MapHeaderIssueFractionTAC_timeStmp_df] DEFAULT CURRENT_TIMESTAMP,
    [status] NVARCHAR(1000) NOT NULL CONSTRAINT [MapHeaderIssueFractionTAC_status_df] DEFAULT 'use',
    CONSTRAINT [MapHeaderIssueFractionTAC_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- AddForeignKey
ALTER TABLE [dbo].[BoxTAC] ADD CONSTRAINT [BoxTAC_headerId_fkey] FOREIGN KEY ([headerId]) REFERENCES [dbo].[HeaderIssueTempTAC]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[MapHeaderIssueFractionTAC] ADD CONSTRAINT [MapHeaderIssueFractionTAC_boxId_fkey] FOREIGN KEY ([boxId]) REFERENCES [dbo].[BoxTAC]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
