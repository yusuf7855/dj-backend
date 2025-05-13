const Playlist = require('../models/Playlist');
const authMiddleware = require('../middlewares/authMiddleware');

exports.createPlaylist = async (req, res) => {
  try {
    console.log('Request body:', req.body);
    console.log('User ID from token:', req.userId);

    const { name, musicId } = req.body;
    const userId = req.userId;

    if (!userId) {
      console.log('Unauthorized access - no userId');
      return res.status(401).json({ message: 'Unauthorized access' });
    }

    if (!name) {
      console.log('Playlist name is required');
      return res.status(400).json({ message: 'Playlist name is required' });
    }

    const newPlaylist = new Playlist({
      name,
      userId,
      musics: musicId ? [musicId] : []
    });

    console.log('New playlist to be saved:', newPlaylist);

    await newPlaylist.save();
    
    console.log('Playlist created successfully:', newPlaylist);
    res.status(201).json(newPlaylist);
  } catch (err) {
    console.error('Error creating playlist:', err);
    res.status(400).json({ 
      message: 'Error creating playlist',
      error: err.message 
    });
  }
};

exports.getUserPlaylists = async (req, res) => {
  try {
    const playlists = await Playlist.find({ userId: req.params.userId })
      .populate({
        path: 'musics',
        select: 'title artist spotifyId', // Only get necessary fields
      })
      .lean();


    res.json({
      success: true,
      playlists: playlists.map(playlist => ({
        _id: playlist._id,
        name: playlist.name,
        description: playlist.description || '',
        musicCount: playlist.musics?.length || 0,
        musics: playlist.musics?.map(music => ({
          title: music.title,
          artist: music.artist,
          spotifyId: music.spotifyId
        })) || [],
        createdAt: playlist.createdAt
      }))
    });
  } catch (err) {
    console.error('Error fetching playlists:', err);
    res.status(500).json({ 
      success: false,
      message: 'Error fetching playlists',
      error: err.message 
    });
  }
};