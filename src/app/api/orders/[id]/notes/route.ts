import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { note, author, source = 'VOZ', audioUrl } = body;

    if (!note || !note.trim()) {
      return NextResponse.json(
        { success: false, error: 'El contenido de la nota no puede estar vacío' },
        { status: 400 }
      );
    }

    const newNote = await prisma.workOrderProgressNote.create({
      data: {
        workOrderId: id,
        note: note.trim(),
        author: author || 'Mecánico',
        source,
        audioUrl: audioUrl || null,
      },
    });

    return NextResponse.json({ success: true, note: newNote }, { status: 201 });
  } catch (error) {
    console.error('Error adding progress note:', error);
    return NextResponse.json(
      { success: false, error: 'Error al agregar nota de avance' },
      { status: 500 }
    );
  }
}
