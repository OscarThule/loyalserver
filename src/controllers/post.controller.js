import User from '#models/User.js';
import Post from '#models/post.js';   // ✅ Missing Post model import
import mongoose from 'mongoose';
import path from 'path';
import fs from 'fs';
import os from "os";

// Helper to get your LAN IP
function getLocalIp() {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === "IPv4" && !iface.internal) {
        return iface.address;
      }
    }
  }
  return "localhost";
}

// Format response consistently
const formatPostResponse = (post, req) => {
  const serverHost =
    process.env.SERVER_HOST || `${getLocalIp()}:${process.env.PORT || 5002}`;

  return {
    id: post._id,
    content: post.content,
    media: post.media
      ? `${req.protocol}://${serverHost}/uploads/${path.basename(post.media)}`
      : null,

    author: {
      id: post.author.id,
      name: post.author.name,
      username: post.author.username,
    },

    likes: post.likes,
    comments: post.comments.map((comment) => ({
      id: comment._id,
      content: comment.content,
      author: {
        id: comment.author.id,
        name: comment.author.name,
      },
      createdAt: comment.createdAt || new Date(),
    })),

    shares: post.shares,
    createdAt: post.createdAt || new Date(),

    ...(post.repost && {
      repost: {
        repostId: post.repost._id || post.repost.originalPostId,
        originalPostId: post.repost.originalPostId,
        originalAuthor: post.repost.originalAuthor,
        originalAuthorId: post.repost.originalAuthorId,
        originalContent: post.repost.originalContent,
        originalMedia: post.repost.originalMedia
          ? `${req.protocol}://${serverHost}/uploads/${path.basename(
              post.repost.originalMedia
            )}`
          : null,
      },
    }),
  };
};

/* ---------------- Controllers ---------------- */

export const createPost = async (req, res) => {
  try {
    const { content } = req.body;
    const mediaFile = req.file;

    if (!content && !mediaFile) {
      return res.status(400).json({
        success: false,
        message: 'Post content or media is required',
      });
    }

    const author = await User.findById(req.userId);
    if (!author) {
      if (mediaFile) fs.unlinkSync(mediaFile.path);
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    const postData = {
      content,
      author: {
        id: author._id,
        name: author.name,
        username: author.username,
        email: author.email,
      },
      likes: [],
      comments: [],
      shares: [],
    };

    if (mediaFile) {
      postData.media = mediaFile.path;
    }

    const post = new Post(postData);
    await post.save();

    return res.status(201).json({
      success: true,
      post: formatPostResponse(post, req),
    });
  } catch (error) {
    if (req.file) fs.unlinkSync(req.file.path);
    console.error('Create post error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to create post',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

export const getUserPosts = async (req, res) => {
  try {
    const posts = await Post.find({ 'author.id': req.userId })
      .sort({ createdAt: -1 });

    return res.json({
      success: true,
      posts: posts.map((post) => formatPostResponse(post, req)),
    });
  } catch (error) {
    console.error('Get posts error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to get posts',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

export const likePost = async (req, res) => {
  try {
    const { postId } = req.params;

    if (!postId || !mongoose.Types.ObjectId.isValid(postId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid post ID',
      });
    }

    const userId = req.userId;
    const post = await Post.findById(postId);

    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found',
      });
    }

    const likeIndex = post.likes.findIndex(
      (id) => id.toString() === userId.toString()
    );

    if (likeIndex >= 0) {
      post.likes.splice(likeIndex, 1); // unlike
    } else {
      post.likes.push(userId); // like
    }

    await post.save();

    res.json({
      success: true,
      post: formatPostResponse(post, req),
    });
  } catch (error) {
    console.error('Like post error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to like post',
      error: error.message,
    });
  }
};

export const addComment = async (req, res) => {
  try {
    const { postId } = req.params;
    const { content } = req.body;

    if (!content) {
      return res.status(400).json({
        success: false,
        message: 'Comment content is required',
      });
    }

    const user = await User.findById(req.userId);
    const post = await Post.findById(postId);

    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found',
      });
    }

    const newComment = {
      content,
      author: {
        id: user._id,
        name: user.name,
        username: user.username,
      },
      createdAt: new Date(),
    };

    post.comments.push(newComment);
    await post.save();

    res.json({
      success: true,
      post: formatPostResponse(post, req),
    });
  } catch (error) {
    console.error('Add comment error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add comment',
      error: error.message,
    });
  }
};

export const sharePost = async (req, res) => {
  try {
    const { postId } = req.params;
    const userId = req.userId;

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found',
      });
    }

    if (post.shares.includes(userId)) {
      return res.status(400).json({
        success: false,
        message: 'Post already shared by this user',
      });
    }

    post.shares.push(userId);
    await post.save();

    res.json({
      success: true,
      post: formatPostResponse(post, req),
    });
  } catch (error) {
    console.error('Share post error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to share post',
      error: error.message,
    });
  }
};

export const deletePost = async (req, res) => {
  try {
    const { postId } = req.params;
    const userId = req.userId;

    const post = await Post.findOne({
      _id: postId,
      'author.id': userId,
    });

    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found or you are not the author',
      });
    }

    if (post.media) {
      try {
        fs.unlinkSync(post.media);
      } catch (err) {
        console.error('Error deleting media file:', err);
      }
    }

    await Post.deleteOne({ _id: postId });

    res.json({
      success: true,
      message: 'Post deleted successfully',
    });
  } catch (error) {
    console.error('Delete post error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete post',
      error: error.message,
    });
  }
};
