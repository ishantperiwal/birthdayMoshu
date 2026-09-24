# Face blink decals

Created using the built-in image generation tool, editing the original user-supplied face decals.

- Male asset: [faceDecalguy-blink.png](../manualAssets/faceDecalguy-blink.png)
- Female asset: [faceDecal-blink.png](../manualAssets/faceDecal-blink.png)

The original open-eye assets are unchanged. The face material samples only the generated eyelid band during a blink, masks the white background, and keeps the original eyebrows and mouth. Blink textures are shared per character type, with no additional mesh or draw call. Each face has an independent 2.4–6.8 second pause, a 140–175 ms blink and occasional double blinks. Timing is local visual animation, including remote character meshes; it needs no network events.

Use “Hold eyes closed” in the guy preview to inspect the closed frame; resume natural blinking afterward. The effect also runs in the main scene and her outfit preview, including idle and lying poses.

## Male edit prompt

EDIT TARGET: the attached male LEGO face decal. Make the eyes CLOSED for one blink animation frame. Remove BOTH large oval black eyes and their white dots completely. Replace each eye with a thin dark gently downward-curved CLOSED EYELID stroke, without lashes. No open eyes or white eye dots must remain. Keep original eyebrows and smiling mouth and all their positions absolutely unchanged. Keep exact canvas proportions and margins. Eyelid centers x=0.30 and x=0.635, y=0.40 relative to image. Lid width about .15 of image width, stroke thickness .015 of image height. Match dark brown black softly textured toy face printing. Plain pure WHITE background so the game shader can mask it. No checkerboard, skin, head, outline, border, text, or additional details. One face decal, with BOTH EYES CLOSED.

## Female edit prompt

Edit this female LEGO face decal into a CLOSED EYES blink frame. Remove both black oval eyes AND white dots completely and replace them with gently downward-curving dark closed eyelids, with small outward eyelashes. Keep the original eyebrows and lips, original relative positions and whitespace margins, canvas aspect ratio. Match softly textured dark toy printing. Closed lids at original eye midpoints. Plain solid WHITE background (#FFFFFF) for runtime masking, absolutely no checkerboard. No skin, no face/head outline, no text. Both eyes must be CLOSED. One matching face decal only.
