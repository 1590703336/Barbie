import mongoose from "mongoose";

const expenseSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,         
    },
    title: {
      type: String,
      required: [true, "Expense title is required"]        
    },
    amount: {
      type: Number,
      required: [true, "Expense amount is required"]
    },
    currency: {
      type: String,
      enum: ['EUR', 'USD', 'CNY', 'AUD'],
      default: 'USD',
    },
    category: {
      type: String,
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
    date: {
      type: Date,
      default: Date.now,    
    },
    notes: {
      type: String,
    },
  },
  { timestamps: true }   
);

expenseSchema.set("toJSON", {
    virtuals: true,
    transform(_, ret) {
      ret.id = ret._id;
      delete ret._id;
      delete ret.__v;
    }
  });
  

export default mongoose.model("Expense", expenseSchema);
