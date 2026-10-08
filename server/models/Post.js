const mongoose = require("mongoose")

const postSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Post title is required"],
      trim: true,
      maxlength: [100, "Title cannot be more than 100 characters"],
    },
    image: {
      type: String,
      default: "https://images.unsplash.com/photo-1615494487949-f5f68968330e?crop=entropy&cs=tinysrgb&fit=crop&fm=jpg&q=80&w=160&h=160",
    },
    platforms: {
      type: [String],
      default: [],
    },
    date: {
      type: String,
      default: "",
    },
    time: {
      type: String,
      default: "",
    },
    status: {
      type: String,
      enum: ["Pending", "Published", "Failed"],
      default: "Pending",
    },
    // Ye post KIS user ki hai — sabse important field!
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
  },
)

module.exports = mongoose.model("Post", postSchema)