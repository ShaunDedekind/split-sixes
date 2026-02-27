import { useState, useEffect } from 'react';
import { getCourses, saveCourse, deleteCourse, createCourse } from '../utils/storage';

export default function Courses() {
  const [courses, setCourses] = useState([]);
  const [editing, setEditing] = useState(null); // null | course object
  const [newName, setNewName] = useState('');
  const [newHoleCount, setNewHoleCount] = useState(18);
  const [error, setError] = useState('');

  useEffect(() => {
    setCourses(getCourses());
  }, []);

  function handleCreate() {
    const name = newName.trim();
    if (!name) { setError('Course name required'); return; }
    if (courses.some(c => c.name.toLowerCase() === name.toLowerCase())) {
      setError('Course already exists'); return;
    }
    const course = createCourse(name, newHoleCount);
    saveCourse(course);
    setCourses(getCourses());
    setNewName('');
    setNewHoleCount(18);
    setError('');
    setEditing(course);
  }

  function handleDelete(id) {
    deleteCourse(id);
    setCourses(getCourses());
    if (editing?.id === id) setEditing(null);
  }

  function handleEditHole(holeIdx, field, value) {
    const updated = {
      ...editing,
      holes: editing.holes.map((h, i) =>
        i === holeIdx ? { ...h, [field]: Number(value) } : h
      ),
    };
    setEditing(updated);
  }

  function handleSaveEdits() {
    saveCourse(editing);
    setCourses(getCourses());
    setEditing(null);
  }

  if (editing) {
    const isPreset = !!editing.preset;
    const hasNine = editing.holes.some(h => h.nine);
    return (
      <div className="page">
        <div className="page-header">
          <button className="btn btn-outline btn-sm" onClick={() => setEditing(null)}>← Back</button>
          <h2 className="page-title">{editing.name}</h2>
          {isPreset && <span className="badge">Preset</span>}
        </div>

        <div className="card">
          {isPreset ? (
            <p className="optional" style={{ fontSize: '0.85rem' }}>
              This is a preset course. Par and stroke index are read-only.
            </p>
          ) : (
            <p className="field-label" style={{ marginBottom: '0.5rem' }}>
              Set Par and Stroke Index for each hole.<br />
              <span className="optional">Stroke Index 1 = hardest hole (gets strokes first)</span>
            </p>
          )}

          <div className="course-hole-table-wrap">
            <table className="course-hole-table">
              <thead>
                <tr>
                  <th>Hole</th>
                  {hasNine && <th>Nine</th>}
                  <th>Par</th>
                  <th>SI</th>
                </tr>
              </thead>
              <tbody>
                {editing.holes.map((hole, i) => (
                  <tr key={i}>
                    <td className="hole-num-cell">{hole.holeNumber}</td>
                    {hasNine && (
                      <td>
                        <span className={`nine-badge nine-${hole.nine?.toLowerCase()}`}>{hole.nine}</span>
                      </td>
                    )}
                    <td>
                      {isPreset ? (
                        <span>{hole.par}</span>
                      ) : (
                        <select
                          className="hole-select"
                          value={hole.par}
                          onChange={e => handleEditHole(i, 'par', e.target.value)}
                        >
                          {[3, 4, 5, 6].map(p => <option key={p} value={p}>{p}</option>)}
                        </select>
                      )}
                    </td>
                    <td>
                      {isPreset ? (
                        <span>{hole.strokeIndex}</span>
                      ) : (
                        <select
                          className="hole-select"
                          value={hole.strokeIndex}
                          onChange={e => handleEditHole(i, 'strokeIndex', e.target.value)}
                        >
                          {Array.from({ length: editing.holeCount }, (_, k) => k + 1).map(si => (
                            <option key={si} value={si}>{si}</option>
                          ))}
                        </select>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td><strong>Total</strong></td>
                  {hasNine && <td></td>}
                  <td><strong>{editing.holes.reduce((s, h) => s + h.par, 0)}</strong></td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          </div>

          {!isPreset && (
            <button className="btn btn-primary btn-full" style={{ marginTop: '1rem' }} onClick={handleSaveEdits}>
              Save Course
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="hero" style={{ paddingTop: '1rem', paddingBottom: '1rem' }}>
        <h1 className="hero-title" style={{ fontSize: '1.5rem' }}>Courses</h1>
        <p className="hero-sub">Manage golf courses & hole data</p>
      </div>

      <div className="card">
        <h2 className="section-title">Add New Course</h2>
        <input
          className="input"
          placeholder="Course name"
          value={newName}
          onChange={e => { setNewName(e.target.value); setError(''); }}
          onKeyDown={e => e.key === 'Enter' && handleCreate()}
        />
        <div className="row-2" style={{ marginTop: '0.75rem' }}>
          <div>
            <label className="field-label">Holes</label>
            <select className="input" value={newHoleCount} onChange={e => setNewHoleCount(Number(e.target.value))}>
              <option value={9}>9 Holes</option>
              <option value={18}>18 Holes</option>
            </select>
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-end' }}>
            <button className="btn btn-gold btn-full" onClick={handleCreate}>Create</button>
          </div>
        </div>
        {error && <p className="error-msg">{error}</p>}
      </div>

      <div className="card">
        <h2 className="section-title">Saved Courses</h2>
        {courses.length === 0 && (
          <p className="empty-msg">No courses yet — add one above.</p>
        )}
        <div className="player-list">
          {courses.map(course => {
            const totalPar = course.holes.reduce((s, h) => s + h.par, 0);
            return (
              <div key={course.id} className="player-row">
                <button className="player-select" onClick={() => setEditing(course)}>
                  <span className="player-name">{course.name}</span>
                  <span className="optional" style={{ marginLeft: '0.5rem' }}>
                    {course.holeCount} holes · Par {totalPar}
                  </span>
                </button>
                <button className="btn-icon" title="Delete course" onClick={() => handleDelete(course.id)}>✕</button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
