const express = require('express');
const router = express.Router();
const musicController = require('../controllers/musicController');

router.get('/', musicController.getAllMusic);
router.get('/category/:category', musicController.getMusicByCategory);
router.post('/', musicController.addMusic);
router.put('/:id', musicController.updateMusic);
router.delete('/:id', musicController.deleteMusic);
router.post('/:id/like', musicController.likeMusic);
router.post('/:id/add-to-playlist', musicController.addToPlaylist);

module.exports = router;