import Note from '../models/Note.js';
import { logActivity } from '../services/activityService.js';

// @desc    Get all notes for a project
// @route   GET /api/projects/:projectId/notes
// @access  Private (VIEWER+)
export const getNotes = async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const { category, search } = req.query;

    const query = { project: projectId };

    if (category && category !== 'all') {
      query.category = category;
    }

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { content: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } }
      ];
    }

    const notes = await Note.find(query)
      .populate('author', 'name username avatar')
      .populate('lastEditedBy', 'name username avatar')
      .sort({ updatedAt: -1 });

    res.status(200).json({
      success: true,
      count: notes.length,
      notes
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single note by ID
// @route   GET /api/projects/:projectId/notes/:noteId
// @access  Private (VIEWER+)
export const getNoteById = async (req, res, next) => {
  try {
    const { projectId, noteId } = req.params;

    const note = await Note.findOne({ _id: noteId, project: projectId })
      .populate('author', 'name username avatar email')
      .populate('lastEditedBy', 'name username avatar email');

    if (!note) {
      return res.status(404).json({
        success: false,
        message: 'Note not found in this project'
      });
    }

    res.status(200).json({
      success: true,
      note
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create new note
// @route   POST /api/projects/:projectId/notes
// @access  Private (MEMBER+)
export const createNote = async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const { title, content, category, tags } = req.body;

    const parsedTags = Array.isArray(tags)
      ? tags
      : typeof tags === 'string' && tags.trim()
      ? tags.split(',').map((t) => t.trim().toLowerCase()).filter(Boolean)
      : [];

    const note = await Note.create({
      project: projectId,
      author: req.user._id,
      lastEditedBy: req.user._id,
      title,
      content: content || '',
      category: category || 'general',
      tags: parsedTags
    });

    await logActivity({
      projectId,
      userId: req.user._id,
      action: 'created_note',
      entityType: 'note',
      entityId: note._id,
      details: { title: note.title, category: note.category }
    });

    const populated = await Note.findById(note._id)
      .populate('author', 'name username avatar')
      .populate('lastEditedBy', 'name username avatar');

    res.status(201).json({
      success: true,
      message: 'Note created successfully',
      note: populated
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update existing note
// @route   PUT /api/projects/:projectId/notes/:noteId
// @access  Private (MEMBER+)
export const updateNote = async (req, res, next) => {
  try {
    const { projectId, noteId } = req.params;
    const { title, content, category, tags } = req.body;

    const note = await Note.findOne({ _id: noteId, project: projectId });

    if (!note) {
      return res.status(404).json({
        success: false,
        message: 'Note not found in this project'
      });
    }

    // Role check: Author can always update; ADMIN/OWNER can update any note
    const isAuthor = note.author.toString() === req.user._id.toString();
    const isAdminOrOwner = ['ADMIN', 'OWNER'].includes(req.projectRole);

    if (!isAuthor && !isAdminOrOwner) {
      return res.status(403).json({
        success: false,
        message: 'You can only edit notes you created, or request an admin to update it'
      });
    }

    if (title) note.title = title;
    if (content !== undefined) note.content = content;
    if (category) note.category = category;
    if (tags !== undefined) {
      note.tags = Array.isArray(tags)
        ? tags
        : tags.split(',').map((t) => t.trim().toLowerCase()).filter(Boolean);
    }
    note.lastEditedBy = req.user._id;

    await note.save();

    await logActivity({
      projectId,
      userId: req.user._id,
      action: 'updated_note',
      entityType: 'note',
      entityId: note._id,
      details: { title: note.title, category: note.category }
    });

    const populated = await Note.findById(note._id)
      .populate('author', 'name username avatar')
      .populate('lastEditedBy', 'name username avatar');

    res.status(200).json({
      success: true,
      message: 'Note updated successfully',
      note: populated
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete note
// @route   DELETE /api/projects/:projectId/notes/:noteId
// @access  Private (MEMBER+)
export const deleteNote = async (req, res, next) => {
  try {
    const { projectId, noteId } = req.params;

    const note = await Note.findOne({ _id: noteId, project: projectId });

    if (!note) {
      return res.status(404).json({
        success: false,
        message: 'Note not found in this project'
      });
    }

    // Role check: Author can delete; ADMIN/OWNER can delete
    const isAuthor = note.author.toString() === req.user._id.toString();
    const isAdminOrOwner = ['ADMIN', 'OWNER'].includes(req.projectRole);

    if (!isAuthor && !isAdminOrOwner) {
      return res.status(403).json({
        success: false,
        message: 'You can only delete notes you created, or request an admin to remove it'
      });
    }

    const title = note.title;
    await Note.findByIdAndDelete(noteId);

    await logActivity({
      projectId,
      userId: req.user._id,
      action: 'deleted_note',
      entityType: 'note',
      details: { title }
    });

    res.status(200).json({
      success: true,
      message: 'Note deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};
