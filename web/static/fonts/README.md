# Noto Color Emoji

`noto-color-emoji.woff2` contains Google's Noto Color Emoji font in COLRv1 format.
Version 2.057. Copyright 2022 Google Inc.
Licensed under the SIL Open Font License 1.1 in `OFL.txt`.

Source: [Noto-COLRv1.ttf](https://github.com/googlefonts/noto-emoji/blob/06121655d0e82f9cae6e7ba6feed4fa6fdbfc2a4/2D/fonts/Noto-COLRv1.ttf).

The WOFF2 file contains the full font, compressed with FontTools:

```sh
uv run --with fonttools --with brotli fonttools ttLib.woff2 compress Noto-COLRv1.ttf -o noto-color-emoji.woff2
```
