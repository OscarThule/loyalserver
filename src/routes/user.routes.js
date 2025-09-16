import express from 'express';
import auth from '../middleware/auth.js';
import {
  createPost,
  getUserPosts,
  likePost,
  addComment,
  sharePost,
  deletePost
} from '../controllers/post.controller.js';
import upload from '../middleware/multer.js';

const router = express.Router();

// Create a new post (with Cloudinary file upload support)
router.post('/', auth, upload.single('media'), createPost);

// Get current user's posts
router.get('/my-posts', auth, getUserPosts);

// Like/unlike a post
router.post('/:postId/like', auth, likePost);

// Add comment to a post
router.post('/:postId/comments', auth, addComment);

// Share a post
router.post('/:postId/share', auth, sharePost);

// Delete a post
router.delete('/:postId', auth, deletePost);

export default router;
