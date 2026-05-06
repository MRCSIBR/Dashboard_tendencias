import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

const dataFile = path.join(process.cwd(), 'data', 'bookmarks.json');

async function getBookmarks() {
  try {
    const data = await fs.readFile(dataFile, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    // If file doesn't exist or is invalid, return default
    return ["oil", "dogecoin"];
  }
}

async function saveBookmarks(bookmarks: string[]) {
  try {
    await fs.mkdir(path.dirname(dataFile), { recursive: true });
    await fs.writeFile(dataFile, JSON.stringify(bookmarks, null, 2));
  } catch (error) {
    console.error('Failed to save bookmarks:', error);
    throw error;
  }
}

export async function GET() {
  const bookmarks = await getBookmarks();
  return NextResponse.json(bookmarks);
}

export async function POST(request: Request) {
  try {
    const { keyword } = await request.json();
    if (!keyword) return NextResponse.json({ error: 'Keyword is required' }, { status: 400 });
    
    const bookmarks = await getBookmarks();
    if (!bookmarks.includes(keyword)) {
      bookmarks.push(keyword);
      await saveBookmarks(bookmarks);
    }
    return NextResponse.json(bookmarks);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to add bookmark' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { keyword } = await request.json();
    if (!keyword) return NextResponse.json({ error: 'Keyword is required' }, { status: 400 });
    
    let bookmarks = await getBookmarks();
    bookmarks = bookmarks.filter((b: string) => b !== keyword);
    await saveBookmarks(bookmarks);
    
    return NextResponse.json(bookmarks);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete bookmark' }, { status: 500 });
  }
}
