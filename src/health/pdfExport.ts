import { jsPDF } from 'jspdf';
import { FitnessLocalState } from './types';
import { HealthDashboard } from '../api';

export function exportProgressPdf(opts: {
  fitness: FitnessLocalState;
  health: HealthDashboard | null;
  displayName: string;
}) {
  const doc = new jsPDF();
  const { fitness, health, displayName } = opts;
  let y = 16;

  doc.setFontSize(18);
  doc.text('AETHERIS · Corpus', 14, y);
  y += 8;
  doc.setFontSize(11);
  doc.text(`Athlete: ${displayName}`, 14, y);
  y += 6;
  doc.text(`Exported: ${new Date().toLocaleString('ru-RU')}`, 14, y);
  y += 10;

  doc.setFontSize(14);
  doc.text('Summary', 14, y);
  y += 8;
  doc.setFontSize(10);
  const sessions = fitness.workouts.filter((w) => w.status === 'completed').length;
  const sets = fitness.setLogs.length;
  const totalMin = fitness.workouts.reduce((s, x) => s + (x.durationMin || 0), 0);
  const kcal = fitness.workouts.reduce((s, x) => s + (x.caloriesEst || 0), 0);
  doc.text(`Workouts completed: ${sessions}`, 14, y);
  y += 5;
  doc.text(`Sets logged: ${sets}`, 14, y);
  y += 5;
  doc.text(`Training time: ${totalMin} min`, 14, y);
  y += 5;
  doc.text(`Calories (est.): ${kcal} kcal`, 14, y);
  y += 8;

  if (health) {
    doc.text(`Discipline index today: ${health.discipline_score}`, 14, y);
    y += 5;
    doc.text(`Steps: ${health.steps} / ${health.goals.steps}`, 14, y);
    y += 5;
    doc.text(`Water: ${health.water_ml} ml`, 14, y);
    y += 10;
  }

  doc.setFontSize(14);
  doc.text('Recent sets', 14, y);
  y += 8;
  doc.setFontSize(9);
  for (const log of fitness.setLogs.slice(0, 25)) {
    if (y > 270) {
      doc.addPage();
      y = 16;
    }
    doc.text(
      `${log.loggedAt.slice(0, 10)} · ${log.exerciseId} · ${log.reps} reps @ ${log.weightKg} kg`,
      14,
      y
    );
    y += 5;
  }

  doc.save(`aetheris-corpus-${new Date().toISOString().slice(0, 10)}.pdf`);
}
