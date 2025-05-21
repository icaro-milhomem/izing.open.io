module.exports = (sequelize, DataTypes) => {
  const InternalMessage = sequelize.define('InternalMessage', {
    message: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    read: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    }
  })

  InternalMessage.associate = (models) => {
    InternalMessage.belongsTo(models.User, {
      foreignKey: 'senderId',
      as: 'sender'
    })
    InternalMessage.belongsTo(models.User, {
      foreignKey: 'receiverId',
      as: 'receiver'
    })
  }

  return InternalMessage
} 