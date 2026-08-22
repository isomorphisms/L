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
const int HURWITZ_TERMS = 6;

vec2 c_mul(vec2 left, vec2 right) {
    return vec2(
        left.x * right.x - left.y * right.y,
        left.x * right.y + left.y * right.x
    );
}

vec2 c_div(vec2 numerator, vec2 denominator) {
    float norm = max(dot(denominator, denominator), 1.0e-30);
    return vec2(
        numerator.x * denominator.x + numerator.y * denominator.y,
        numerator.y * denominator.x - numerator.x * denominator.y
    ) / norm;
}

vec2 positive_base_power(float base, vec2 exponent) {
    float log_base = log(base);
    float log_radius = clamp(exponent.x * log_base, -80.0, 80.0);
    float angle = exponent.y * log_base;
    float radius = exp(log_radius);
    return radius * vec2(cos(angle), sin(angle));
}

/*
 * Euler-Maclaurin continuation of Hurwitz zeta:
 *
 * zeta(s,a) =
 *   sum_{n=0}^{N-1} (n+a)^(-s)
 *   + (N+a)^(1-s)/(s-1)
 *   + 1/2 (N+a)^(-s)
 *   + B2/2!  (s)_1 (N+a)^(-s-1)
 *   + B4/4!  (s)_3 (N+a)^(-s-3)
 *   + B6/6!  (s)_5 (N+a)^(-s-5)
 *
 * N=6 is a visual/mobile approximation, not a high-precision evaluator.
 */
vec2 hurwitz_zeta(vec2 s, float a) {
    vec2 value = vec2(0.0);

    for (int n = 0; n < HURWITZ_TERMS; ++n) {
        value += positive_base_power(float(n) + a, -s);
    }

    float tail = float(HURWITZ_TERMS) + a;
    vec2 one_minus_s = vec2(1.0 - s.x, -s.y);
    vec2 s_minus_one = vec2(s.x - 1.0, s.y);

    value += c_div(
        positive_base_power(tail, one_minus_s),
        s_minus_one
    );
    value += 0.5 * positive_base_power(tail, -s);

    vec2 rising1 = s;
    vec2 rising3 = c_mul(c_mul(s, s + vec2(1.0, 0.0)), s + vec2(2.0, 0.0));
    vec2 rising5 = c_mul(
        c_mul(rising3, s + vec2(3.0, 0.0)),
        s + vec2(4.0, 0.0)
    );

    value += (1.0 / 12.0)
        * c_mul(rising1, positive_base_power(tail, -s - vec2(1.0, 0.0)));
    value -= (1.0 / 720.0)
        * c_mul(rising3, positive_base_power(tail, -s - vec2(3.0, 0.0)));
    value += (1.0 / 30240.0)
        * c_mul(rising5, positive_base_power(tail, -s - vec2(5.0, 0.0)));

    return value;
}

/*
 * For primitive non-principal chi mod q:
 *   L(s, chi) = q^(-s) sum_{a=1}^q chi(a) zeta(s, a/q).
 *
 * These are the first three bundled LMFDB neighbors:
 *   3.2 -> 1-3-3.2-r1-0-0
 *   4.3 -> 1-2e2-4.3-r1-0-0
 *   5.4 -> 1-5-5.4-r0-0-0
 */
vec2 evaluate_chi3(vec2 s) {
    vec2 residues =
        hurwitz_zeta(s, 1.0 / 3.0)
        - hurwitz_zeta(s, 2.0 / 3.0);
    return c_mul(positive_base_power(3.0, -s), residues);
}

vec2 evaluate_chi4(vec2 s) {
    vec2 residues =
        hurwitz_zeta(s, 1.0 / 4.0)
        - hurwitz_zeta(s, 3.0 / 4.0);
    return c_mul(positive_base_power(4.0, -s), residues);
}

vec2 evaluate_chi5(vec2 s) {
    vec2 residues =
        hurwitz_zeta(s, 1.0 / 5.0)
        - hurwitz_zeta(s, 2.0 / 5.0)
        - hurwitz_zeta(s, 3.0 / 5.0)
        + hurwitz_zeta(s, 4.0 / 5.0);
    return c_mul(positive_base_power(5.0, -s), residues);
}

vec2 evaluate_l_raw(int object_index, vec2 s) {
    if (object_index == 0) return evaluate_chi3(s);
    if (object_index == 1) return evaluate_chi4(s);
    return evaluate_chi5(s);
}

vec2 evaluate_l(int object_index, vec2 s) {
    /*
     * Each Hurwitz term has a pole at s=1 although these non-principal
     * character combinations do not. Avoid a single-pixel 0/0 by taking
     * the symmetric limiting value in a tiny neighborhood.
     */
    vec2 from_one = s - vec2(1.0, 0.0);
    if (dot(from_one, from_one) < 9.0e-6) {
        vec2 offset = vec2(0.004, 0.0);
        return 0.5 * (
            evaluate_l_raw(object_index, s - offset)
            + evaluate_l_raw(object_index, s + offset)
        );
    }
    return evaluate_l_raw(object_index, s);
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

float glyph_2(vec2 p) {
    float top = box(p, vec4(0.12, 0.78, 0.78, 0.92));
    float upper_right = box(p, vec4(0.64, 0.43, 0.78, 0.92));
    float middle = box(p, vec4(0.12, 0.43, 0.78, 0.57));
    float lower_left = box(p, vec4(0.12, 0.08, 0.26, 0.57));
    float bottom = box(p, vec4(0.12, 0.08, 0.78, 0.22));
    return max(max(top, upper_right), max(middle, max(lower_left, bottom)));
}

float glyph_3(vec2 p) {
    float top = box(p, vec4(0.12, 0.78, 0.78, 0.92));
    float right = box(p, vec4(0.64, 0.08, 0.78, 0.92));
    float middle = box(p, vec4(0.12, 0.43, 0.78, 0.57));
    float bottom = box(p, vec4(0.12, 0.08, 0.78, 0.22));
    return max(max(top, right), max(middle, bottom));
}

float glyph_4(vec2 p) {
    float right = box(p, vec4(0.66, 0.08, 0.80, 0.92));
    float middle = box(p, vec4(0.14, 0.43, 0.80, 0.57));
    float upper_left = box(p, vec4(0.14, 0.43, 0.28, 0.92));
    return max(right, max(middle, upper_left));
}

float glyph_5(vec2 p) {
    float top = box(p, vec4(0.12, 0.78, 0.78, 0.92));
    float upper_left = box(p, vec4(0.12, 0.43, 0.26, 0.92));
    float middle = box(p, vec4(0.12, 0.43, 0.78, 0.57));
    float lower_right = box(p, vec4(0.64, 0.08, 0.78, 0.57));
    float bottom = box(p, vec4(0.12, 0.08, 0.78, 0.22));
    return max(max(top, upper_left), max(middle, max(lower_right, bottom)));
}

float glyph_dot(vec2 p) {
    return box(p, vec4(0.35, 0.08, 0.65, 0.28));
}

float label_32(vec2 p) {
    vec2 three = (p - vec2(0.10, 0.12)) / vec2(0.24, 0.76);
    vec2 dot = (p - vec2(0.40, 0.12)) / vec2(0.10, 0.76);
    vec2 two = (p - vec2(0.57, 0.12)) / vec2(0.24, 0.76);
    return max(glyph_3(three), max(glyph_dot(dot), glyph_2(two)));
}

float label_43(vec2 p) {
    vec2 four = (p - vec2(0.10, 0.12)) / vec2(0.24, 0.76);
    vec2 dot = (p - vec2(0.40, 0.12)) / vec2(0.10, 0.76);
    vec2 three = (p - vec2(0.57, 0.12)) / vec2(0.24, 0.76);
    return max(glyph_4(four), max(glyph_dot(dot), glyph_3(three)));
}

float label_54(vec2 p) {
    vec2 five = (p - vec2(0.10, 0.12)) / vec2(0.24, 0.76);
    vec2 dot = (p - vec2(0.40, 0.12)) / vec2(0.10, 0.76);
    vec2 four = (p - vec2(0.57, 0.12)) / vec2(0.24, 0.76);
    return max(glyph_5(five), max(glyph_dot(dot), glyph_4(four)));
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
    float ink = chip == 0 ? label_32(local)
        : (chip == 1 ? label_43(local) : label_54(local));
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
    vec2 s = u_center + vec2(
        v_ndc.x * u_half_height * portrait_aspect,
        portrait_y * u_half_height
    );

    vec2 value = evaluate_l(u_object, s);
    frag_color = vec4(wegert_color(value), 1.0);
}
