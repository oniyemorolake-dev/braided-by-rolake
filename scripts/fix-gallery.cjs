const { execSync } = require('child_process')
const fs = require('fs')

const path = 'c:/byRolake/src/data.ts'
// Start from last committed good file
let text = execSync('git show HEAD:src/data.ts', { encoding: 'buffer' }).toString('utf8')

const gallery = `export const GALLERY: GalleryItem[] = [
  {
    id: 'g1',
    title: 'Medium knotless',
    caption: 'Shoulder-length knotless - everyday favourite.',
    image: '/gallery/knotless.jpg',
  },
  {
    id: 'g2',
    title: 'Box braids',
    caption: 'Classic box braids with clean parts.',
    image: '/gallery/box.jpg',
  },
  {
    id: 'g3',
    title: 'Feed-in cornrows',
    caption: 'Straight-back feed-ins with a clean finish.',
    image: '/gallery/cornrows.jpg',
  },
  {
    id: 'g4',
    title: 'Passion twists',
    caption: 'Soft twists with a romantic fall.',
    image: '/gallery/twists.jpg',
  },
  {
    id: 'g5',
    title: 'Kids styles',
    caption: 'Gentle styles for ages 4-11.',
    image: '/gallery/kids.jpg',
  },
  {
    id: 'g6',
    title: 'Cornrow ponytail',
    caption: 'Sleek parts into a polished ponytail.',
    image: '/gallery/ponytail.jpg',
  },
  {
    id: 'g7',
    title: 'Boho knotless',
    caption: 'Goddess strands for that vacation look.',
    image: '/gallery/boho-knotless.jpg',
  },
  {
    id: 'g8',
    title: 'Fulani braids',
    caption: 'Tribal design with optional beads.',
    image: '/gallery/fulani.jpg',
  },
  {
    id: 'g9',
    title: 'French curls',
    caption: 'Braids with soft curly ends.',
    image: '/gallery/french-curls.jpg',
  },
  {
    id: 'g10',
    title: 'Island braids',
    caption: 'Chunky vacation-ready braids.',
    image: '/gallery/island-braids.jpg',
  },
  {
    id: 'g11',
    title: 'Soft locs',
    caption: 'Lightweight faux locs.',
    image: '/gallery/soft-locs.jpg',
  },
  {
    id: 'g12',
    title: 'Take out & care',
    caption: 'Gentle removal and no-wash detangling.',
    image: '/gallery/take-out.jpg',
  },
]`

if (text.includes('export const GALLERY: GalleryItem[] = []')) {
  text = text.replace('export const GALLERY: GalleryItem[] = []', gallery)
} else {
  text = text.replace(/export const GALLERY: GalleryItem\[] = \[[\s\S]*?\n\]/, gallery)
}

fs.writeFileSync(path, text, { encoding: 'utf8' })
console.log('gallery restored with clean utf8')
