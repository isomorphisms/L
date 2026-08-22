#version 300 es
precision highp float;
precision highp int;

in vec2 v_ndc;
layout(location = 0) out vec4 frag_color;

uniform vec2 u_center;
uniform float u_half_height;
uniform float u_aspect;
uniform int u_object;

const float TAU = 6.28318530717958647692;
const float LOG_10 = 2.30258509299404568402;
const float NAV_FRACTION = 0.18;
const int TERM_COUNT = 17;

const float E4[TERM_COUNT] = float[TERM_COUNT](
    1.0, 240.0, 2160.0, 6720.0, 17520.0, 30240.0, 60480.0,
    82560.0, 140400.0, 181680.0, 272160.0, 319680.0, 490560.0,
    527520.0, 743040.0, 846720.0, 1123440.0
);

const float E6[TERM_COUNT] = float[TERM_COUNT](
    1.0, -504.0, -16632.0, -122976.0, -532728.0, -1575504.0,
    -4058208.0, -8471232.0, -17047800.0, -29883672.0, -51991632.0,
    -81170208.0, -129985632.0, -187132176.0, -279550656.0,
    -384422976.0, -545530104.0
);

const float ETA3_8[TERM_COUNT] = float[TERM_COUNT](
    0.0, 1.0, 0.0, 0.0, -8.0, 0.0, 0.0, 20.0, 0.0,
    0.0, 0.0, 0.0, 0.0, -70.0, 0.0, 0.0, 64.0
);

vec2 complex_multiply(vec2 left, vec2 right) {
    return vec2(
        left.x * right.x - left.y * right.y,
        left.x * right.y + left.y * right.x
    );
}

float coefficient(int object_index, int term) {
    if (object_index == 0) return E4[term];
    if (object_index == 1) return E6[term];
    return ETA3_8[term];
}

vec2 evaluate_form(int object_index, vec2 z) {
    float radius = exp(-TAU * z.y);
    float angle = TAU * z.x;
    vec2 q = radius * vec2(cos(angle), sin(angle));
    vec2 power = vec2(1.0, 0.0);
    vec2 value = vec2(coefficient(object_index, 0), 0.0);

    for (int term = 1; term < TERM_COUNT; ++term) {
        power = complex_multiply(power, q);
        value += coefficient(object_index, term) * power;
    }
    return value;
}

float positive_fract(float value) {
    return value - floor(value);
}

float srgb_component(float linear_value) {
    float value = max(linear_value, 0.0);
    if (value <= 0.0031308) return 12.92 * value;
    return 1.055 * pow(value, 1.0 / 2.4) - 0.055;
}

vec3 hcl_to_srgb(float hue_degrees, float chroma, float lightness) {
    float hue = radians(hue_degrees);
    float u_star = chroma * cos(hue);
    float v_star = chroma * sin(hue);

    const float white_u_prime = 0.19783982482140777;
    const float white_v_prime = 0.46833630293240974;

    float y = lightness > 8.0
        ? pow((lightness + 16.0) / 116.0, 3.0)
        : lightness / 903.2962962962963;

    float u_prime = u_star / (13.0 * lightness) + white_u_prime;
    float v_prime = v_star / (13.0 * lightness) + white_v_prime;
    float x = (9.0 * y * u_prime) / (4.0 * v_prime);
    float zz = y * (12.0 - 3.0 * u_prime - 20.0 * v_prime) / (4.0 * v_prime);

    float linear_r =  3.2404542 * x - 1.5371385 * y - 0.4985314 * zz;
    float linear_g = -0.9692660 * x + 1.8760108 * y + 0.0415560 * zz;
    float linear_b =  0.0556434 * x - 0.2040259 * y + 1.0572252 * zz;

    return clamp(vec3(
        srgb_component(linear_r),
        srgb_component(linear_g),
        srgb_component(linear_b)
    ), 0.0, 1.0);
}

vec3 wegert_color(vec2 value) {
    float phase = atan(value.y, value.x);
    float modulus = max(length(value), 1.0e-30);
    float log_modulus = log(modulus);
    float hue_degrees = 360.0 * positive_fract(phase / TAU);
    float log_modulus_band = positive_fract(log_modulus / LOG_10);
    float lightness = 66.0
        + 4.0 * log_modulus_band
        + 3.0 * positive_fract(hue_degrees / 100.0);
    return hcl_to_srgb(hue_degrees, 45.0, lightness);
}

float box(vec2 p, vec4 bounds) {
    return step(bounds.x, p.x)
        * step(bounds.y, p.y)
        * step(p.x, bounds.z)
        * step(p.y, bounds.w);
}

float glyph_e(vec2 p) {
    float left = box(p, vec4(0.08, 0.08, 0.22, 0.92));
    float top = box(p, vec4(0.08, 0.78, 0.84, 0.92));
    float middle = box(p, vec4(0.08, 0.43, 0.72, 0.57));
    float bottom = box(p, vec4(0.08, 0.08, 0.84, 0.22));
    return max(max(left, top), max(middle, bottom));
}

float glyph_4(vec2 p) {
    float right = box(p, vec4(0.66, 0.08, 0.80, 0.92));
    float middle = box(p, vec4(0.14, 0.43, 0.80, 0.57));
    float upper_left = box(p, vec4(0.14, 0.43, 0.28, 0.92));
    return max(right, max(middle, upper_left));
}

float glyph_6(vec2 p) {
    float left = box(p, vec4(0.10, 0.08, 0.24, 0.92));
    float top = box(p, vec4(0.10, 0.78, 0.78, 0.92));
    float middle = box(p, vec4(0.10, 0.43, 0.76, 0.57));
    float bottom = box(p, vec4(0.10, 0.08, 0.78, 0.22));
    float lower_right = box(p, vec4(0.64, 0.08, 0.78, 0.57));
    return max(max(left, top), max(max(middle, bottom), lower_right));
}

float glyph_9(vec2 p) {
    float top = box(p, vec4(0.12, 0.78, 0.78, 0.92));
    float middle = box(p, vec4(0.12, 0.43, 0.78, 0.57));
    float upper_left = box(p, vec4(0.12, 0.43, 0.26, 0.92));
    float right = box(p, vec4(0.64, 0.08, 0.78, 0.92));
    return max(max(top, middle), max(upper_left, right));
}

float glyph_dot(vec2 p) {
    return box(p, vec4(0.35, 0.08, 0.65, 0.28));
}

float label_e4(vec2 p) {
    vec2 e = (p - vec2(0.16, 0.12)) / vec2(0.28, 0.76);
    vec2 four = (p - vec2(0.54, 0.12)) / vec2(0.28, 0.76);
    return max(glyph_e(e), glyph_4(four));
}

float label_e6(vec2 p) {
    vec2 e = (p - vec2(0.16, 0.12)) / vec2(0.28, 0.76);
    vec2 six = (p - vec2(0.54, 0.12)) / vec2(0.28, 0.76);
    return max(glyph_e(e), glyph_6(six));
}

float label_94(vec2 p) {
    vec2 nine = (p - vec2(0.10, 0.12)) / vec2(0.24, 0.76);
    vec2 dot = (p - vec2(0.40, 0.12)) / vec2(0.10, 0.76);
    vec2 four = (p - vec2(0.57, 0.12)) / vec2(0.24, 0.76);
    return max(glyph_9(nine), max(glyph_dot(dot), glyph_4(four)));
}

vec3 navigation_color(float x01, float y01) {
    float scaled = min(x01 * 3.0, 2.999999);
    int chip = int(floor(scaled));
    vec2 local = vec2(fract(scaled), y01 / NAV_FRACTION);
    bool is_current = chip == u_object;
    vec3 background = is_current ? vec3(0.20) : vec3(0.075);
    float edge = max(
        max(step(local.x, 0.018), step(0.982, local.x)),
        max(step(local.y, 0.04), step(0.96, local.y))
    );
    float ink = chip == 0 ? label_e4(local)
        : (chip == 1 ? label_e6(local) : label_94(local));
    vec3 color = mix(background, vec3(0.30), edge * 0.55);
    return mix(color, vec3(0.95), ink);
}

void main() {
    float x01 = 0.5 * (v_ndc.x + 1.0);
    float y01 = 0.5 * (v_ndc.y + 1.0);

    if (y01 < NAV_FRACTION) {
        frag_color = vec4(navigation_color(x01, y01), 1.0);
        return;
    }

    float portrait_y = ((y01 - NAV_FRACTION) / (1.0 - NAV_FRACTION)) * 2.0 - 1.0;
    float portrait_aspect = u_aspect / (1.0 - NAV_FRACTION);
    vec2 z = u_center + vec2(
        v_ndc.x * u_half_height * portrait_aspect,
        portrait_y * u_half_height
    );

    if (z.y <= 0.0) {
        frag_color = vec4(vec3(0.025), 1.0);
        return;
    }

    vec2 value = evaluate_form(u_object, z);
    frag_color = vec4(wegert_color(value), 1.0);
}
