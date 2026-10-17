export function drawCrop(context, cropId, stage, x, y, time = 0, scale = 1) {
  const ellipse = (left, top, width, height, color, angle = 0) => {
    context.fillStyle = color;
    context.beginPath();
    context.ellipse(left, top, width, height, angle, 0, Math.PI * 2);
    context.fill();
  };
  const stem = (points, color = '#405d43', width = 1.7) => {
    context.strokeStyle = color;
    context.lineWidth = width;
    context.beginPath();
    points.forEach(([left, top], index) => index ? context.lineTo(left, top) : context.moveTo(left, top));
    context.stroke();
  };
  context.save();
  context.translate(x, y);
  context.scale(scale, scale);
  if (stage === 'Seed') {
    ellipse(0, 2, 6, 2, '#604638');
    const colors = { wheat: '#e9b44c', potatoes: '#c7a384', beans: '#ded8b0', clover: '#91ac6d' };
    ellipse(0, 0, cropId === 'potatoes' ? 4 : 2.5, 2, colors[cropId], -0.4);
    stem([[-4, 5], [4, 5]], '#ac8971', 1);
    context.restore();
    return;
  }
  context.rotate(Math.sin(time / 1000 + x * 0.04 + y * 0.02) * 0.045);
  if (stage === 'Sprout') {
    stem([[0, 5], [0, -5]]);
    const leaf = cropId === 'clover' ? '#a7bf76' : '#8baa67';
    ellipse(-4, -3, cropId === 'wheat' ? 2 : 5, 2.5, leaf, 0.5);
    ellipse(4, -6, cropId === 'wheat' ? 2 : 5, 2.5, leaf, -0.5);
    if (cropId === 'beans') stem([[0, -5], [2, -10], [5, -10]], '#8baa67', 1);
    if (cropId === 'potatoes') ellipse(0, 5, 4, 2, '#a8896c');
    context.restore();
    return;
  }
  if (cropId === 'wheat') {
    for (const offset of [-5, 0, 5]) {
      stem([[offset, 6], [offset, -13]], '#b09a50', 1.4);
      for (let grain = 0; grain < 3; grain++) {
        ellipse(offset - 2, -7 - grain * 3, 2, 3, '#e9b44c', -0.6);
        ellipse(offset + 2, -9 - grain * 3, 2, 3, '#f3d079', 0.6);
      }
    }
  } else if (cropId === 'potatoes') {
    stem([[0, 5], [0, -9]]);
    for (const offset of [-6, 6]) {
      ellipse(offset, -5, 6, 3, '#6f9659', offset / 10);
      ellipse(offset / 2, -11, 5, 3, '#9fb872', -offset / 10);
    }
    ellipse(-4, 5, 5, 3.5, '#c8a279', -0.3);
    ellipse(5, 4, 5, 3, '#dfbd92', 0.4);
    ellipse(-5, 4, 0.8, 0.7, '#8e6b51');
    ellipse(6, 3, 0.8, 0.7, '#8e6b51');
    ellipse(0, -13, 2, 2, '#eee1e4');
  } else if (cropId === 'beans') {
    stem([[-1, 6], [1, -13]], '#bfa477', 2);
    stem([[1, 4], [-3, 0], [2, -6], [-1, -12], [2, -17]], '#567f4b', 1.5);
    ellipse(-5, -11, 5, 2.5, '#8baa67', 0.5);
    ellipse(6, -6, 5, 2.5, '#9fbc79', -0.5);
    ellipse(-4, -1, 2.5, 6, '#c2d58c', -0.2);
    ellipse(5, 1, 2.5, 6, '#a7c674', 0.3);
    stem([[-4, -4], [-4, 2]], '#7b9c59', 0.7);
  } else if (cropId === 'clover') {
    for (const offset of [-5, 4]) {
      stem([[0, 6], [offset, -4]], '#6c8f53', 1);
      ellipse(offset - 3, -4, 3.5, 3, '#8baa67');
      ellipse(offset + 3, -4, 3.5, 3, '#a7bf76');
      ellipse(offset, -8, 3, 3.5, '#94b36e');
    }
    stem([[2, 5], [3, -13]], '#6c8f53', 1);
    ellipse(3, -14, 3.5, 4, '#d9a5b5');
    ellipse(2, -16, 2, 2, '#efd0d5');
  }
  context.restore();
}
