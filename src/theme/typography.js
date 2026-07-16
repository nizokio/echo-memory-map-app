import { Platform } from 'react-native';

const fontFamily = Platform.select({
  ios: 'System',
  android: 'Roboto',
  default: 'System',
});

export const typography = {
  h1: { fontSize: 22, fontWeight: '700', fontFamily },
  h2: { fontSize: 21, fontWeight: '700', fontFamily },
  h3: { fontSize: 17, fontWeight: '700', fontFamily },
  h4: { fontSize: 16, fontWeight: '700', fontFamily },
  body: { fontSize: 14, fontWeight: '400', fontFamily },
  bodySmall: { fontSize: 13.5, fontWeight: '400', fontFamily },
  caption: { fontSize: 13, fontWeight: '400', fontFamily },
  captionSmall: { fontSize: 12.5, fontWeight: '400', fontFamily },
  label: { fontSize: 12, fontWeight: '400', fontFamily },
  pill: { fontSize: 13.5, fontWeight: '600', fontFamily },
  tab: { fontSize: 12.5, fontWeight: '600', fontFamily },
  button: { fontSize: 15, fontWeight: '700', fontFamily },
  seeMore: { fontSize: 14, fontWeight: '600', fontFamily },
  rating: { fontSize: 13, fontWeight: '400', fontFamily },
  echoTitle: { fontSize: 14.5, fontWeight: '700', fontFamily },
  echoMeta: { fontSize: 12, fontWeight: '400', fontFamily },
};
