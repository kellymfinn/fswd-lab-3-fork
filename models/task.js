'use strict';
module.exports = (sequelize, DataTypes) => {
  var Task = sequelize.define('Task', {
    name: {
      type: DataTypes.STRING,
      validate: {
        notNull: true,
        notEmpty: true,
      }
    },



    completedAt: DataTypes.DATE
  }, {
    scopes: {
      incomplete: {
        where: {
          completedAt: null
        }
      },
      completedToday: function() {
        return {
          where: {
            completedAt: {
              gt: new Date()
            }
          }
        }
      },
      completedXDaysAgo: function(x) {
        return {
          where: {
            completedAt: {
              gt: (new Date()) - (x * 24 * 60 * 60 * 1000)
            }
          }
        }
      }
    }
  });

  Task.prototype.isCompleted = function() {
    return !!this.completedAt;
  };

  Task.prototype.markCompleted = function() {
    this.completedAt = new Date();
    return this.save();
  };

  Task.associate = function(models) {
    Task.belongsTo(models.User);
  };

  return Task;
};