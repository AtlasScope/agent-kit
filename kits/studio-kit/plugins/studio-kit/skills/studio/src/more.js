/* MORE: choices the agent added when someone asked for more. Keys are control keys: a bare key (material) or
   'button.material' is the button studio's; other studios are '<studio>.<key>': palette, type, surface, spacing, motion, icons (see references/).
   Each entry: [value, 'Plain name', 'One short plain sentence', {optional}]. Colours: swatch:[['Name',hue,chroma,lightness,'Sentence']].
   Optional: {set:{key:value}} changes other values with it; {onlyWith:{material:['glass']}} hides it where it would not show;
   {setup:true} marks a measured project value that is not new. Backgrounds: bg:[['NAME','Name','Sentence']].
   A whole finished look: look:[['id','Name','Sentence',{set:{...every value that makes it}}]] ('palette.look', 'type.look' for the others).
   A button choice that needs CSS gets its class in <style id="more-css">: material .m-NAME, idle .i-NAME, idle2 .l-NAME, hover .h-NAME,
   press .p-NAME, iconfx .if-NAME, entrance .e-NAME, shape .sh-NAME, focus .f-NAME, bg .device[data-bg=NAME], menuStyle .menu.NAME.
   Behaviour (confirm, split) goes in MORE_JS. Run `studio.mjs check` after every edit. */
const MORE={
};
const MORE_JS={confirm:{},split:{}};
