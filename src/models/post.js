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

// Repost Schema
const RepostSchema = new mongoose.Schema({
  originalPostId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Post',
  },
  originalAuthor: String,
  originalAuthorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  originalContent: String,
  originalMedia: String,
});

// Post Schema
const PostSchema = new mongoose.Schema(
  {
    content: {
      type: String,
      required: false, // Allow posts with only media
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
      email: {
        type: String, // Add email to match controller
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
      type: String, // Cloudinary URL
      default: null,
    },
    publicId: {
      type: String, // Cloudinary public_id for deletion
      default: null,
    },
    repost: {
      type: RepostSchema,
      default: null,
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: function (doc, ret) {
        ret.id = ret._id;
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  }
);

// Virtual properties
PostSchema.virtual('totalLikes').get(function () {
  return this.likes.length;
});

PostSchema.virtual('totalComments').get(function () {
  return this.comments.length;
});

PostSchema.virtual('totalShares').get(function () {
  return this.shares.length;
});

export default mongoose.model('Post', PostSchema);