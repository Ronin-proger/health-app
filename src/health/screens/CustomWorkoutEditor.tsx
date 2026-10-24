import { useMemo, useState } from 'react';
import { Trash2 } from 'lucide-react';
import { useFitness } from '../FitnessContext';
import { EXERCISES, defaultPrescription } from '../exerciseCatalog';
import { athleteCover, COVER_GALLERY } from '../catalog/photos';
import { CustomWorkout, ExercisePrescription, MuscleGroup } from '../types';
import { FitImage } from '../components/FitImage';
import { MUSCLE_FILTERS } from '../exerciseCatalog';

export function CustomWorkoutEditor({
  editId,
  onDone,
}: {
  editId?: string;
  onDone: () => void;
}) {
  const { fitness, addCustomWorkout, updateCustomWorkout, deleteCustomWorkout } = useFitness();
  const existing = useMemo(
    () => fitness.customWorkouts.find((c) => c.id === editId),
    [editId, fitness.customWorkouts]
  );

  const [name, setName] = useState(existing?.name ?? '');
  const [group, setGroup] = useState<MuscleGroup>(existing?.muscleGroup ?? 'push');
  const [desc, setDesc] = useState(existing?.description ?? '');
  const [durationMin, setDurationMin] = useState(existing?.durationMin ?? 45);
  const [caloriesEst, setCaloriesEst] = useState(existing?.caloriesEst ?? 300);
  const [coverUrl, setCoverUrl] = useState(existing?.coverUrl ?? existing?.imageUrl ?? athleteCover());
  const [picked, setPicked] = useState<string[]>(existing?.exerciseIds ?? []);
  const [exFilter, setExFilter] = useState<MuscleGroup | 'all'>('all');
  const [touched, setTouched] = useState(false);
  const [prescriptions, setPrescriptions] = useState<ExercisePrescription[]>(
    existing?.prescriptions ??
      (existing?.exerciseIds ?? []).map((id) => defaultPrescription(id))
  );

  const toggle = (id: string) => {
    setPicked((p) => {
      if (p.includes(id)) {
        setPrescriptions((rx) => rx.filter((r) => r.exerciseId !== id));
        return p.filter((x) => x !== id);
      }
      setPrescriptions((rx) => [...rx, defaultPrescription(id)]);
      return [...p, id];
    });
  };

  const updateRx = (exerciseId: string, patch: Partial<ExercisePrescription>) => {
    setPrescriptions((rx) =>
      rx.map((r) => (r.exerciseId === exerciseId ? { ...r, ...patch } : r))
    );
  };

  const payload = (): Omit<CustomWorkout, 'id'> => ({
    name: name.trim(),
    muscleGroup: group,
    description: desc.trim() || undefined,
    exerciseIds: picked,
    prescriptions: prescriptions.filter((r) => picked.includes(r.exerciseId)),
    coverUrl,
    imageUrl: coverUrl,
    durationMin,
    caloriesEst,
  });

  const valid = name.trim().length >= 2 && picked.length > 0;

  const save = () => {
    setTouched(true);
    if (!valid) return;
    if (editId) updateCustomWorkout(editId, payload());
    else addCustomWorkout(payload());
    onDone();
  };

  const filteredExercises = EXERCISES.filter(
    (ex) => exFilter === 'all' || ex.muscleGroup === exFilter
  );

  const remove = () => {
    if (editId && confirm('Delete this workout?')) {
      deleteCustomWorkout(editId);
      onDone();
    }
  };

  return (
    <div className="fit-scroll fx-screen">
      <div className="fx-card fx-editor-cover">
        <FitImage src={coverUrl} alt="" variant="hero" className="fx-cover-preview" fallbackLabel={name || 'Workout'} />
        <p className="fx-h3">Cover gallery</p>
        <div className="fx-cover-gallery">
          {COVER_GALLERY.map((c) => (
            <button
              key={c.key}
              type="button"
              className={coverUrl === c.url ? 'on' : ''}
              onClick={() => setCoverUrl(c.url)}
            >
              <FitImage src={c.url} alt="" variant="thumb" fallbackLabel={c.key} />
            </button>
          ))}
        </div>
        <label className="fx-lfield">
          Cover image URL
          <input value={coverUrl} onChange={(e) => setCoverUrl(e.target.value)} />
        </label>
      </div>

      <label className="fx-lfield">
        Name
        <input value={name} onChange={(e) => setName(e.target.value)} minLength={2} required />
      </label>
      <label className="fx-lfield">
        Description
        <textarea rows={3} value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="Goal, intensity, notes…" />
      </label>
      <label className="fx-lfield">
        Muscle group
        <select value={group} onChange={(e) => setGroup(e.target.value as MuscleGroup)}>
          <option value="push">Push</option>
          <option value="pull">Pull</option>
          <option value="legs">Legs</option>
          <option value="core">Core</option>
          <option value="all">Full body</option>
        </select>
      </label>
      <div className="fx-form-2col">
        <label>
          Duration
          <input type="number" value={durationMin} onChange={(e) => setDurationMin(Number(e.target.value))} />
        </label>
        <label>
          Calories
          <input type="number" value={caloriesEst} onChange={(e) => setCaloriesEst(Number(e.target.value))} />
        </label>
      </div>

      <h3 className="fx-h3">Exercises ({picked.length} selected)</h3>
      <div className="fx-pills">
        {MUSCLE_FILTERS.map((f) => (
          <button
            key={f.id}
            type="button"
            className={`fx-pill${exFilter === f.id ? ' on' : ''}`}
            onClick={() => setExFilter(f.id)}
          >
            {f.label}
          </button>
        ))}
      </div>
      <ul className="fx-pick-list">
        {filteredExercises.map((ex) => (
          <li key={ex.id}>
            <button
              type="button"
              className={`fx-pick${picked.includes(ex.id) ? ' on' : ''}`}
              onClick={() => toggle(ex.id)}
            >
              <FitImage src={ex.imageUrl} alt="" variant="thumb" fallbackLabel={ex.name} />
              <span>{ex.name}</span>
            </button>
          </li>
        ))}
      </ul>

      {picked.length > 0 && (
        <>
          <h3 className="fx-h3">Sets / reps / weight</h3>
          <ul className="fx-rx-list">
            {prescriptions
              .filter((r) => picked.includes(r.exerciseId))
              .map((r) => {
                const ex = EXERCISES.find((e) => e.id === r.exerciseId);
                return (
                  <li key={r.exerciseId} className="fx-card fx-rx-item">
                    <FitImage src={ex?.imageUrl} alt="" variant="thumb" fallbackLabel={ex?.name} />
                    <div className="fx-rx-fields">
                      <strong>{ex?.name}</strong>
                      <div className="fx-rx-grid">
                        <label>
                          Sets
                          <input
                            type="number"
                            value={r.sets}
                            onChange={(e) => updateRx(r.exerciseId, { sets: Number(e.target.value) })}
                          />
                        </label>
                        <label>
                          Reps
                          <input
                            value={r.reps}
                            onChange={(e) => updateRx(r.exerciseId, { reps: e.target.value })}
                          />
                        </label>
                        <label>
                          Weight
                          <input
                            type="number"
                            value={r.weightKg}
                            onChange={(e) => updateRx(r.exerciseId, { weightKg: Number(e.target.value) })}
                          />
                        </label>
                        <label>
                          Rest s
                          <input
                            type="number"
                            value={r.restSec}
                            onChange={(e) => updateRx(r.exerciseId, { restSec: Number(e.target.value) })}
                          />
                        </label>
                      </div>
                      <input
                        className="fx-rx-notes"
                        placeholder="Notes"
                        value={r.notes ?? ''}
                        onChange={(e) => updateRx(r.exerciseId, { notes: e.target.value })}
                      />
                    </div>
                  </li>
                );
              })}
          </ul>
        </>
      )}

      {touched && !valid && (
        <p className="fx-error">Enter a name (2+ chars) and pick at least one exercise.</p>
      )}
      <button type="button" className="fx-btn fx-btn--primary fx-btn--lg fx-btn--block" onClick={save} disabled={!valid && touched}>
        Save workout
      </button>
      {editId && (
        <button type="button" className="fx-btn fx-btn--ghost fx-btn--block" onClick={remove}>
          <Trash2 size={16} /> Delete workout
        </button>
      )}
    </div>
  );
}
