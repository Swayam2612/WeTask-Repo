'use strict';
const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { query, queryOne, run } = require('../database');
const { authenticate } = require('../middleware/auth');
const router = express.Router();

function enrichTask(task) {
  const assignee = task.assigned_to ? queryOne('SELECT id, name, avatar_color FROM users WHERE id = ?', [task.assigned_to]) : null;
  const creator = queryOne('SELECT id, name, avatar_color FROM users WHERE id = ?', [task.created_by]);
  const project = task.project_id ? queryOne('SELECT id, name, color FROM projects WHERE id = ?', [task.project_id]) : null;
  const team = task.team_id ? queryOne('SELECT id, name, color FROM teams WHERE id = ?', [task.team_id]) : null;
  const commentCount = queryOne('SELECT COUNT(*) as count FROM comments WHERE task_id = ?', [task.id]);
  return { ...task, assignee, creator, project, team, comment_count: commentCount?.count || 0 };
}

function createNotification(userId, type, title, message, data = {}) {
  run('INSERT INTO notifications (id, user_id, type, title, message, data) VALUES (?, ?, ?, ?, ?, ?)',
    [uuidv4(), userId, type, title, message, JSON.stringify(data)]);
}

function notifyTaskAssignees(task, actorId, actorName) {
  const recipients = new Map();
  if (task.assigned_to) recipients.set(task.assigned_to, 'direct');
  else recipients.set(actorId, 'created');

  if (task.team_id) {
    const members = query('SELECT user_id FROM team_members WHERE team_id = ?', [task.team_id]);
    members.forEach(m => {
      if (!recipients.has(m.user_id)) recipients.set(m.user_id, 'team');
    });
  }

  recipients.forEach((scope, userId) => {
    createNotification(
      userId,
      'task_assigned',
      scope === 'created' ? 'Task Created' : 'Task Assigned',
      scope === 'direct'
        ? `${actorName || 'Someone'} assigned you: ${task.title}`
        : scope === 'team'
          ? `${actorName || 'Someone'} assigned a task to your team: ${task.title}`
          : `You created: ${task.title}`,
      { task_id: task.id }
    );
  });
}

// Get all tasks (with filters)
router.get('/', authenticate, (req, res) => {
  try {
    const { status, priority, project_id, team_id, assigned_to, search } = req.query;
    let sql = `SELECT t.* FROM tasks t`;
    const params = [];
    const conditions = [];

    if (req.user.role !== 'admin') {
      sql += ` LEFT JOIN project_members pm ON t.project_id = pm.project_id`;
      sql += ` LEFT JOIN team_members tm ON t.team_id = tm.team_id`;
      conditions.push(`(t.assigned_to = ? OR t.created_by = ? OR pm.user_id = ? OR tm.user_id = ?)`);
      params.push(req.user.id, req.user.id, req.user.id, req.user.id);
    }

    if (status) { conditions.push(`t.status = ?`); params.push(status); }
    if (priority) { conditions.push(`t.priority = ?`); params.push(priority); }
    if (project_id) { conditions.push(`t.project_id = ?`); params.push(project_id); }
    if (team_id) { conditions.push(`t.team_id = ?`); params.push(team_id); }
    if (assigned_to) { conditions.push(`t.assigned_to = ?`); params.push(assigned_to); }
    if (search) { conditions.push(`t.title LIKE ?`); params.push(`%${search}%`); }

    if (conditions.length) sql += ` WHERE ` + conditions.join(' AND ');
    sql += ` GROUP BY t.id ORDER BY t.order_index ASC, t.created_at DESC`;

    const tasks = query(sql, params);
    res.json(tasks.map(enrichTask));
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to fetch tasks' });
  }
});

// Create task
router.post('/', authenticate, (req, res) => {
  try {
    const { title, description, status, priority, project_id, team_id, assigned_to, due_date, estimated_hours, tags } = req.body;
    const normalizedAssignee = assigned_to || null;
    const normalizedTeam = team_id || null;
    if (!title) return res.status(400).json({ error: 'Task title required' });
    const id = uuidv4();
    const maxOrder = queryOne('SELECT MAX(order_index) as max FROM tasks WHERE project_id IS ?', [project_id || null]);
    const orderIndex = (maxOrder?.max || 0) + 1;

    run(`INSERT INTO tasks (id, title, description, status, priority, project_id, team_id, assigned_to, created_by, due_date, estimated_hours, tags, order_index)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, title.trim(), description || '', status || 'todo', priority || 'medium',
       project_id || null, normalizedTeam, normalizedAssignee, req.user.id,
       due_date || null, estimated_hours || 0, JSON.stringify(tags || []), orderIndex]);

    const assigner = queryOne('SELECT name FROM users WHERE id = ?', [req.user.id]);
    notifyTaskAssignees({ id, title, assigned_to: normalizedAssignee, team_id: normalizedTeam }, req.user.id, assigner?.name);

    // Activity log
    run('INSERT INTO activity_log (id, user_id, action, entity_type, entity_id, entity_name) VALUES (?, ?, ?, ?, ?, ?)',
      [uuidv4(), req.user.id, 'created', 'task', id, title]);

    const task = queryOne('SELECT * FROM tasks WHERE id = ?', [id]);
    res.status(201).json(enrichTask(task));
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to create task' });
  }
});

// Get task by id
router.get('/:id', authenticate, (req, res) => {
  try {
    const task = queryOne('SELECT * FROM tasks WHERE id = ?', [req.params.id]);
    if (!task) return res.status(404).json({ error: 'Task not found' });
    res.json(enrichTask(task));
  } catch (e) {
    res.status(500).json({ error: 'Failed to fetch task' });
  }
});

// Update task
router.put('/:id', authenticate, (req, res) => {
  try {
    const task = queryOne('SELECT * FROM tasks WHERE id = ?', [req.params.id]);
    if (!task) return res.status(404).json({ error: 'Task not found' });
    const { title, description, status, priority, team_id, assigned_to, due_date, estimated_hours, actual_hours, tags } = req.body;
    const hasAssigneeChange = Object.prototype.hasOwnProperty.call(req.body, 'assigned_to');
    const hasTeamChange = Object.prototype.hasOwnProperty.call(req.body, 'team_id');
    const normalizedAssignee = hasAssigneeChange ? (assigned_to || null) : task.assigned_to;
    const normalizedTeam = hasTeamChange ? (team_id || null) : task.team_id;

    const newStatus = status || task.status;
    const completedAt = newStatus === 'completed' && task.status !== 'completed' ? 'datetime("now")' : (task.completed_at ? `"${task.completed_at}"` : 'NULL');

    run(`UPDATE tasks SET title=?, description=?, status=?, priority=?, team_id=?, assigned_to=?, due_date=?, estimated_hours=?, actual_hours=?, tags=?, updated_at=datetime("now"), completed_at=${completedAt} WHERE id=?`,
      [title || task.title, description ?? task.description, newStatus,
       priority || task.priority, normalizedTeam, normalizedAssignee,
       due_date ?? task.due_date, estimated_hours ?? task.estimated_hours,
       actual_hours ?? task.actual_hours, tags ? JSON.stringify(tags) : task.tags, req.params.id]);

    if ((hasAssigneeChange && normalizedAssignee !== task.assigned_to) || (hasTeamChange && normalizedTeam !== task.team_id)) {
      const assigner = queryOne('SELECT name FROM users WHERE id = ?', [req.user.id]);
      notifyTaskAssignees(
        { id: req.params.id, title: title || task.title, assigned_to: normalizedAssignee, team_id: normalizedTeam },
        req.user.id,
        assigner?.name
      );
    }

    // Activity log for status change
    if (status && status !== task.status) {
      run('INSERT INTO activity_log (id, user_id, action, entity_type, entity_id, entity_name, details) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [uuidv4(), req.user.id, 'updated', 'task', req.params.id, task.title,
         JSON.stringify({ field: 'status', from: task.status, to: status })]);
    }

    const updated = queryOne('SELECT * FROM tasks WHERE id = ?', [req.params.id]);
    res.json(enrichTask(updated));
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to update task' });
  }
});

// Delete task
router.delete('/:id', authenticate, (req, res) => {
  try {
    const task = queryOne('SELECT * FROM tasks WHERE id = ?', [req.params.id]);
    if (!task) return res.status(404).json({ error: 'Task not found' });
    if (task.created_by !== req.user.id && req.user.role !== 'admin') return res.status(403).json({ error: 'Not authorized' });
    run('DELETE FROM comments WHERE task_id = ?', [req.params.id]);
    run('DELETE FROM tasks WHERE id = ?', [req.params.id]);
    res.json({ message: 'Task deleted' });
  } catch (e) {
    res.status(500).json({ error: 'Failed to delete task' });
  }
});

// Comments
router.get('/:id/comments', authenticate, (req, res) => {
  try {
    const comments = query(`
      SELECT c.*, u.name as user_name, u.avatar_color
      FROM comments c JOIN users u ON c.user_id = u.id
      WHERE c.task_id = ? ORDER BY c.created_at ASC`, [req.params.id]);
    res.json(comments);
  } catch (e) {
    res.status(500).json({ error: 'Failed to fetch comments' });
  }
});

router.post('/:id/comments', authenticate, (req, res) => {
  try {
    const { content } = req.body;
    if (!content) return res.status(400).json({ error: 'Content required' });
    const id = uuidv4();
    run('INSERT INTO comments (id, task_id, user_id, content) VALUES (?, ?, ?, ?)',
      [id, req.params.id, req.user.id, content.trim()]);
    const comment = queryOne(`
      SELECT c.*, u.name as user_name, u.avatar_color
      FROM comments c JOIN users u ON c.user_id = u.id WHERE c.id = ?`, [id]);
    res.status(201).json(comment);
  } catch (e) {
    res.status(500).json({ error: 'Failed to add comment' });
  }
});

router.delete('/:id/comments/:commentId', authenticate, (req, res) => {
  try {
    const comment = queryOne('SELECT * FROM comments WHERE id = ?', [req.params.commentId]);
    if (!comment) return res.status(404).json({ error: 'Comment not found' });
    if (comment.user_id !== req.user.id && req.user.role !== 'admin') return res.status(403).json({ error: 'Not authorized' });
    run('DELETE FROM comments WHERE id = ?', [req.params.commentId]);
    res.json({ message: 'Comment deleted' });
  } catch (e) {
    res.status(500).json({ error: 'Failed to delete comment' });
  }
});

module.exports = router;
