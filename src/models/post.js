import mongoose from 'mongoose';

// Comment Schema
const CommentSchema = new mongoose.Schema(
  {
    content: {
      type: String,
      required: true,
      trim: true,
    },
    author: {
      id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
      },
      name: {
        type: String,
        required: true,
      },
      username: {
        type: String,
        required: true,
      },
    },
  },
  { timestamps: true }
);

// Post Schema
const PostSchema = new mongoose.Schema(
  {
    content: {
      type: String,
      required: true,
      trim: true,
    },
    author: {
      id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
      },
      name: {
        type: String,
        required: true,
      },
      username: {
        type: String,
        required: true,
      },
    },
    likes: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    comments: [CommentSchema],
    shares: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    media: {
      type: String, // store file path or URL
      default: null,
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true, // include virtuals when converting to JSON
      transform: function (doc, ret) {
        ret.id = ret._id;
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  }
);

// Add a virtual property for totalLikes
PostSchema.virtual('totalLikes').get(function () {
  return this.likes.length;
});

// Add a virtual property for totalComments
PostSchema.virtual('totalComments').get(function () {
  return this.comments.length;
});

// Add a virtual property for totalShares
PostSchema.virtual('totalShares').get(function () {
  return this.shares.length;
});

export default mongoose.model('Post', PostSchema);
