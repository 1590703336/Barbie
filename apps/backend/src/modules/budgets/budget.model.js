import mongoose from "mongoose";

// creating the budget schema
const budgetSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },

    category: {
      type: String,
      required: true,
      trim: true,
      enum: [
        "Food",
        "Transport",
        "Entertainment",
        "Utilities",
        "Rent",
        "Health",
        "Others",
      ],
      default: "Others",
    },

    currency: {
      type: String,
      enum: ['EUR', 'USD', 'CNY', 'AUD'],
      default: 'USD',
    },
    amountUSD: {
      type: Number,
      required: false,
    },
    limit: {
      type: Number,
      required: true,
      min: 0
    },

    month: {
      type: Number,
      required: true,
      min: 1,
      max: 12
    },

    year: {
      type: Number,
      required: true,
      min: 2000
    }
  },
  {
    timestamps: true
  }
);


// ensurinmg that each user can have only one budget per category per month and year
budgetSchema.index(
  { user: 1, category: 1, month: 1, year: 1 },
  { unique: true }
);

// ensuring that a id is added to the response always
budgetSchema.set("toJSON", {
  virtuals: true,
  transform(_, ret) {
    ret.id = ret._id;
    delete ret._id;
    delete ret.__v;
  }
});

// create and export the model
const Budget = mongoose.model("Budget", budgetSchema);
export default Budget;
