import React from 'react'
import { Document, Page, Text, View, Image, StyleSheet } from '@react-pdf/renderer'

// react-pdf's built-in Helvetica only covers Latin-1, so Polish diacritics
// render as garbage. Transliterate to ASCII before rendering.
const PL_MAP: Record<string, string> = {
  'ą': 'a', 'ć': 'c', 'ę': 'e', 'ł': 'l', 'ń': 'n',
  'ó': 'o', 'ś': 's', 'ź': 'z', 'ż': 'z',
  'Ą': 'A', 'Ć': 'C', 'Ę': 'E', 'Ł': 'L', 'Ń': 'N',
  'Ó': 'O', 'Ś': 'S', 'Ź': 'Z', 'Ż': 'Z',
}
function pl(v: string | null | undefined): string {
  if (!v) return ''
  return v.replace(/[ąćęłńóśźżĄĆĘŁŃÓŚŹŻ]/g, ch => PL_MAP[ch] ?? ch)
}

// ── Types ──────────────────────────────────────────────────────────────────

type RoomData = { number: number; name: string; area: number | null }

type FloorPlanData = {
  name: string
  area: number | null
  image3dUrl: string | null
  image2dUrl: string | null
  rooms: RoomData[]
}

type KeyFeatureItem = {
  title: string
  subtitle: string | null
}

type GalleryImageData = {
  src: string
  label: string
}

export type UnitPdfData = {
  projectName: string
  unitLabel: string
  totalArea: number | null
  rooms: number | null
  price: number | null
  houseTypeName: string
  floorPlans: FloorPlanData[]
  keyFeatures: KeyFeatureItem[]
  galleryImages: GalleryImageData[]
  companyName: string | null
  companyWebsite: string | null
  companyEmail: string | null
  companyPhone: string | null
  companyAddress: string | null
}

// ── Styles ─────────────────────────────────────────────────────────────────
// A4 landscape = 842 x 595 pt.  Header ~40pt, features ~35pt, padding ~20pt
// Available content height ≈ 500pt

const BROWN_DARK = '#3E1718'
const BROWN = '#6E2E2A'
const BG_CREAM = '#FAF8F5'

const s = StyleSheet.create({
  page: {
    fontFamily: 'Helvetica',
    fontSize: 9,
    color: BROWN_DARK,
    backgroundColor: '#FFFFFF',
    padding: 0,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderBottomWidth: 2,
    borderBottomColor: BROWN,
  },
  headerProject: {
    fontSize: 9,
    color: BROWN_DARK,
    opacity: 0.6,
  },
  headerProjectName: {
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
    color: BROWN_DARK,
  },
  headerUnit: {
    fontSize: 16,
    fontFamily: 'Helvetica-Bold',
    color: BROWN_DARK,
  },
  headerDetail: {
    fontSize: 11,
    color: BROWN,
    fontFamily: 'Helvetica-Bold',
  },
  headerFloor: {
    fontSize: 14,
    fontFamily: 'Helvetica-Bold',
    color: BROWN_DARK,
  },

  // Key features strip
  featuresStrip: {
    flexDirection: 'row',
    backgroundColor: BG_CREAM,
    paddingHorizontal: 30,
    paddingVertical: 7,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E8E0D8',
  },
  featureItem: {
    flex: 1,
    paddingRight: 8,
  },
  featureTitle: {
    fontSize: 7.5,
    fontFamily: 'Helvetica-Bold',
    color: BROWN_DARK,
    marginBottom: 1,
  },
  featureSubtitle: {
    fontSize: 6.5,
    color: BROWN_DARK,
    opacity: 0.7,
  },

  // Main content area — must not overflow page
  content: {
    flexDirection: 'row',
    height: 490,
    paddingHorizontal: 30,
    paddingTop: 10,
    paddingBottom: 10,
  },

  // Left column: 3D image + room table
  leftCol: {
    flex: 3,
    paddingRight: 15,
    overflow: 'hidden',
  },

  // Room table
  roomTable: {
    borderTopWidth: 1,
    borderTopColor: BROWN,
  },
  roomTableHeader: {
    flexDirection: 'row',
    backgroundColor: BROWN,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  roomTableHeaderText: {
    fontSize: 7.5,
    fontFamily: 'Helvetica-Bold',
    color: '#FFFFFF',
    textTransform: 'uppercase',
  },
  roomRow: {
    flexDirection: 'row',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderBottomWidth: 0.5,
    borderBottomColor: '#E8E0D8',
  },
  roomRowAlt: {
    backgroundColor: BG_CREAM,
  },
  roomNr: {
    width: 25,
    fontSize: 8,
    color: BROWN_DARK,
  },
  roomName: {
    flex: 1,
    fontSize: 8,
    color: BROWN_DARK,
  },
  roomArea: {
    width: 55,
    fontSize: 8,
    color: BROWN_DARK,
    textAlign: 'right',
  },
  roomSumaRow: {
    flexDirection: 'row',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderTopWidth: 1,
    borderTopColor: BROWN,
    backgroundColor: BG_CREAM,
  },
  roomSumaText: {
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    color: BROWN_DARK,
  },

  // Right column
  rightCol: {
    flex: 2,
    paddingLeft: 15,
    borderLeftWidth: 1,
    borderLeftColor: '#E8E0D8',
    overflow: 'hidden',
  },

  // 2D floor plan label
  floorPlan2dLabel: {
    fontSize: 7.5,
    fontFamily: 'Helvetica-Bold',
    color: BROWN_DARK,
    textAlign: 'center',
    marginTop: 3,
    marginBottom: 6,
  },

  // Gallery image label
  sideImageLabel: {
    fontSize: 7,
    color: BROWN_DARK,
    opacity: 0.6,
    textAlign: 'center',
    marginTop: 2,
    marginBottom: 4,
  },

  // Company info box
  companyBox: {
    borderWidth: 1,
    borderColor: BROWN,
    borderRadius: 4,
    padding: 8,
    marginTop: 6,
  },
  companyName: {
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    color: BROWN_DARK,
    marginBottom: 3,
  },
  companyLine: {
    fontSize: 7,
    color: BROWN_DARK,
    opacity: 0.8,
    marginBottom: 2,
  },
})

// ── Floor page component ───────────────────────────────────────────────────

function FloorPage({
  data,
  floor,
  galleryImage,
}: {
  data: UnitPdfData
  floor: FloorPlanData
  galleryImage: GalleryImageData | null
}) {
  const image3d = floor.image3dUrl
  const image2d = floor.image2dUrl
  const mainImage = image3d || image2d
  const show2dOnRight = !!(image2d && image3d)

  // Calculate 3D image height: take all remaining space above table
  // Room table ≈ rooms * 11pt + header 14pt + suma 14pt ≈ ~100pt for 5-6 rooms
  const roomTableHeight = floor.rooms.length > 0
    ? 14 + floor.rooms.length * 11 + (floor.area ? 14 : 0)
    : 0
  const image3dHeight = Math.min(370, 470 - roomTableHeight - 10)

  // Right column: 2D gets most space, gallery gets some, company box ~60pt
  const has2d = show2dOnRight
  const hasGallery = !!galleryImage
  const companyHeight = data.companyName ? 65 : 0
  const galleryHeight = hasGallery ? 115 : 0
  const image2dHeight = has2d
    ? 470 - galleryHeight - companyHeight - 20
    : 0

  return (
    <Page size="A4" orientation="landscape" style={s.page} wrap={false}>
      {/* Header */}
      <View style={s.header}>
        <View>
          <Text style={s.headerProject}>Projekt</Text>
          <Text style={s.headerProjectName}>{pl(data.projectName)}</Text>
        </View>
        <Text style={s.headerUnit}>{pl(data.unitLabel)}</Text>
        {data.totalArea && (
          <Text style={s.headerDetail}>
            {data.totalArea.toLocaleString('de-DE', { minimumFractionDigits: 2 })} m²
          </Text>
        )}
        {data.rooms && (
          <Text style={s.headerDetail}>
            {data.rooms} Zimmer
          </Text>
        )}
        {data.price && (
          <Text style={s.headerDetail}>
            {new Intl.NumberFormat('de-DE', { maximumFractionDigits: 0 }).format(data.price)} €
          </Text>
        )}
        <Text style={s.headerFloor}>{pl(floor.name)}</Text>
      </View>

      {/* Key Features Strip */}
      {data.keyFeatures.length > 0 && (
        <View style={s.featuresStrip}>
          {data.keyFeatures.slice(0, 4).map((feat, i) => (
            <View key={i} style={s.featureItem}>
              <Text style={s.featureTitle}>{pl(feat.title)}</Text>
              {feat.subtitle && <Text style={s.featureSubtitle}>{pl(feat.subtitle)}</Text>}
            </View>
          ))}
        </View>
      )}

      {/* Content */}
      <View style={s.content}>
        {/* Left column: 3D floor plan + room table */}
        <View style={s.leftCol}>
          {mainImage && (
            <Image
              src={mainImage}
              style={{
                width: '100%',
                height: image3dHeight,
                objectFit: 'contain',
                marginBottom: 8,
              }}
            />
          )}

          {floor.rooms.length > 0 && (
            <View style={s.roomTable}>
              <View style={s.roomTableHeader}>
                <Text style={[s.roomTableHeaderText, { width: 25 }]}>NR</Text>
                <Text style={[s.roomTableHeaderText, { flex: 1 }]}>{'RAUM'}</Text>
                <Text style={[s.roomTableHeaderText, { width: 55, textAlign: 'right' }]}>FLÄCHE</Text>
              </View>
              {floor.rooms.map((room, i) => (
                <View key={i} style={[s.roomRow, i % 2 === 1 ? s.roomRowAlt : {}]}>
                  <Text style={s.roomNr}>{room.number}</Text>
                  <Text style={s.roomName}>{pl(room.name)}</Text>
                  <Text style={s.roomArea}>
                    {room.area ? `${room.area.toLocaleString('de-DE', { minimumFractionDigits: 2 })} m²` : '—'}
                  </Text>
                </View>
              ))}
              {floor.area && (
                <View style={s.roomSumaRow}>
                  <Text style={[s.roomSumaText, { width: 25 }]}></Text>
                  <Text style={[s.roomSumaText, { flex: 1 }]}>GESAMT</Text>
                  <Text style={[s.roomSumaText, { width: 55, textAlign: 'right' }]}>
                    {floor.area.toLocaleString('de-DE', { minimumFractionDigits: 2 })} m²
                  </Text>
                </View>
              )}
            </View>
          )}
        </View>

        {/* Right column: 2D plan + gallery image + company info */}
        <View style={s.rightCol}>
          {has2d && (
            <View>
              <Image
                src={image2d!}
                style={{
                  width: '100%',
                  height: image2dHeight,
                  objectFit: 'contain',
                  borderRadius: 4,
                }}
              />
              <Text style={s.floorPlan2dLabel}>{pl(`Grundriss ${floor.name.toLowerCase()}`)}</Text>
            </View>
          )}

          {hasGallery && (
            <View>
              <Image
                src={galleryImage!.src}
                style={{
                  width: '100%',
                  height: 110,
                  objectFit: 'cover',
                  borderRadius: 4,
                }}
              />
              {galleryImage!.label && <Text style={s.sideImageLabel}>{pl(galleryImage!.label)}</Text>}
            </View>
          )}

          {data.companyName && (
            <View style={s.companyBox}>
              <Text style={s.companyName}>{pl(data.companyName)}</Text>
              {data.companyWebsite && <Text style={s.companyLine}>{pl(data.companyWebsite)}</Text>}
              {data.companyEmail && <Text style={s.companyLine}>{pl(data.companyEmail)}</Text>}
              {data.companyPhone && <Text style={s.companyLine}>{pl(data.companyPhone)}</Text>}
              {data.companyAddress && <Text style={s.companyLine}>{pl(data.companyAddress)}</Text>}
            </View>
          )}
        </View>
      </View>
    </Page>
  )
}

// ── Main document ──────────────────────────────────────────────────────────

export function UnitPdfDocument({ data }: { data: UnitPdfData }) {
  return (
    <Document
      title={pl(`${data.projectName} - ${data.unitLabel}`)}
      author={pl(data.companyName) || 'VMD'}
    >
      {data.floorPlans.map((floor, index) => {
        const galleryImage = data.galleryImages.length > 0
          ? data.galleryImages[index % data.galleryImages.length]
          : null

        return (
          <FloorPage
            key={index}
            data={data}
            floor={floor}
            galleryImage={galleryImage}
          />
        )
      })}
    </Document>
  )
}
