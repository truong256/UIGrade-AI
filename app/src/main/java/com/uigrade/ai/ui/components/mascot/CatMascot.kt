package com.uigrade.ai.ui.components.mascot

import androidx.compose.animation.*
import androidx.compose.animation.core.*
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.ExperimentalFoundationApi
import androidx.compose.foundation.background
import androidx.compose.foundation.combinedClickable
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.material3.MaterialTheme
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.rotate
import androidx.compose.ui.draw.scale
import androidx.compose.ui.geometry.CornerRadius
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.*
import androidx.compose.ui.graphics.drawscope.DrawScope
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch
import kotlin.random.Random

private val RANDOM_QUOTES = listOf(
    "Meo! Chào bạn nhé!",
    "Hôm nay mình cùng học thật tốt nhé!",
    "Bạn cần mình giúp gì không?",
    "Cố lên, bạn làm được mà!",
    "Meo meo! Đừng quên kiểm tra thông tin nhé."
)

/**
 * Official UIGrade AI Cat Mascot component with rich physics animations,
 * state reactivity, touch & long-press interactivity, and customizable styling.
 */
@OptIn(ExperimentalFoundationApi::class)
@Composable
fun CatMascot(
    state: CatMascotState,
    modifier: Modifier = Modifier,
    style: CatMascotStyle = CatMascotStyle.Default,
    message: String? = null,
    onClick: (() -> Unit)? = null,
    onLongClick: (() -> Unit)? = null
) {
    val coroutineScope = rememberCoroutineScope()

    var internalSpeech by remember { mutableStateOf<String?>(null) }
    var isTapped by remember { mutableStateOf(false) }
    var isLongPressed by remember { mutableStateOf(false) }

    // Tap bounce animation
    val tapOffsetY = remember { Animatable(0f) }
    val tapScale = remember { Animatable(1f) }
    val tapRotate = remember { Animatable(0f) }
    val shakeOffsetX = remember { Animatable(0f) }

    val infiniteTransition = rememberInfiniteTransition(label = "CatInfiniteAnimation")

    // Continuous floating bobbing
    val idleOffsetY by infiniteTransition.animateFloat(
        initialValue = -4f,
        targetValue = 4f,
        animationSpec = infiniteRepeatable(
            animation = tween(2200, easing = EaseInOutSine),
            repeatMode = RepeatMode.Reverse
        ),
        label = "IdleBobbing"
    )

    // Gentle breathing scale
    val breathingScale by infiniteTransition.animateFloat(
        initialValue = 0.985f,
        targetValue = 1.015f,
        animationSpec = infiniteRepeatable(
            animation = tween(2600, easing = EaseInOutSine),
            repeatMode = RepeatMode.Reverse
        ),
        label = "BreathingScale"
    )

    // Ear twitch or tail wag
    val earWiggle by infiniteTransition.animateFloat(
        initialValue = -2.5f,
        targetValue = 2.5f,
        animationSpec = infiniteRepeatable(
            animation = tween(1800, easing = EaseInOutQuad),
            repeatMode = RepeatMode.Reverse
        ),
        label = "EarWiggle"
    )

    val activeMessage = internalSpeech ?: message

    val handleTap: () -> Unit = {
        onClick?.invoke()
        coroutineScope.launch {
            isTapped = true
            val randomQuote = RANDOM_QUOTES[Random.nextInt(RANDOM_QUOTES.size)]
            internalSpeech = randomQuote

            // Bounce jump + scale up + slight head tilt
            launch {
                tapOffsetY.animateTo(-16f, tween(180, easing = EaseOutQuad))
                tapOffsetY.animateTo(0f, spring(dampingRatio = 0.55f, stiffness = 380f))
            }
            launch {
                tapScale.animateTo(1.09f, tween(160, easing = EaseOutQuad))
                tapScale.animateTo(1.0f, spring(dampingRatio = 0.6f, stiffness = 400f))
            }
            launch {
                tapRotate.animateTo(-6f, tween(140))
                tapRotate.animateTo(6f, tween(200))
                tapRotate.animateTo(0f, spring(dampingRatio = 0.7f, stiffness = 400f))
            }

            delay(3500)
            internalSpeech = null
            isTapped = false
        }
    }

    val handleLongPress: () -> Unit = {
        onLongClick?.invoke()
        coroutineScope.launch {
            isLongPressed = true
            internalSpeech = "Meo... nhột quá!"

            // Tickle shake animation
            repeat(4) {
                shakeOffsetX.animateTo(-6f, tween(60))
                shakeOffsetX.animateTo(6f, tween(60))
            }
            shakeOffsetX.animateTo(0f, tween(80))

            delay(3000)
            internalSpeech = null
            isLongPressed = false
        }
    }

    Column(
        horizontalAlignment = Alignment.CenterHorizontally,
        modifier = modifier.semantics {
            contentDescription = "Linh vật mèo UIGrade AI đang ở trạng thái ${state.name}"
        }
    ) {
        // Speech Bubble
        if (style.showSpeechBubble && !activeMessage.isNullOrBlank()) {
            CatSpeechBubble(
                message = activeMessage,
                isError = state == CatMascotState.Error,
                isSuccess = state == CatMascotState.Success,
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(bottom = 8.dp)
            )
        }

        // Mascot Body Canvas with Physics & Gestures
        Box(
            modifier = Modifier
                .size(style.size)
                .offset(x = shakeOffsetX.value.dp, y = (idleOffsetY + tapOffsetY.value).dp)
                .scale(breathingScale * tapScale.value)
                .rotate(tapRotate.value + if (state == CatMascotState.Listening) 4f else 0f)
                .clip(CircleShape)
                .combinedClickable(
                    interactionSource = remember { MutableInteractionSource() },
                    indication = null,
                    onClick = handleTap,
                    onLongClick = handleLongPress
                ),
            contentAlignment = Alignment.Center
        ) {
            // Background soft aura glow
            val glowColor = when (state) {
                CatMascotState.Success -> MaterialTheme.colorScheme.tertiary.copy(alpha = 0.25f)
                CatMascotState.Error -> MaterialTheme.colorScheme.error.copy(alpha = 0.25f)
                CatMascotState.Worried -> MaterialTheme.colorScheme.error.copy(alpha = 0.15f)
                CatMascotState.Happy, CatMascotState.Excited -> MaterialTheme.colorScheme.primary.copy(alpha = 0.22f)
                else -> MaterialTheme.colorScheme.primaryContainer.copy(alpha = 0.35f)
            }

            Box(
                modifier = Modifier
                    .size(style.size * 0.92f)
                    .clip(CircleShape)
                    .background(
                        Brush.radialGradient(
                            colors = listOf(glowColor, glowColor.copy(alpha = 0.04f), Color.Transparent)
                        )
                    )
            )

            // Vector Sharp Dynamic Mascot Drawing
            Canvas(modifier = Modifier.fillMaxSize()) {
                drawCatMascot(
                    state = if (isLongPressed) CatMascotState.Sleeping else if (isTapped) CatMascotState.Happy else state,
                    style = style,
                    earWiggle = earWiggle
                )
            }
        }
    }
}

/**
 * Draws the vector illustration of the cat mascot according to emotional state and style tokens.
 */
private fun DrawScope.drawCatMascot(
    state: CatMascotState,
    style: CatMascotStyle,
    earWiggle: Float
) {
    val width = size.width
    val height = size.height

    val centerX = width / 2f
    val centerY = height / 2f

    val headRadius = width * 0.36f
    val headCenter = Offset(centerX, centerY + height * 0.04f)

    // 1. Ears (Left & Right)
    val leftEarPath = Path().apply {
        moveTo(headCenter.x - headRadius * 0.72f, headCenter.y - headRadius * 0.45f)
        lineTo(headCenter.x - headRadius * 0.88f, headCenter.y - headRadius * 1.15f + earWiggle)
        lineTo(headCenter.x - headRadius * 0.15f, headCenter.y - headRadius * 0.82f)
        close()
    }
    val rightEarPath = Path().apply {
        moveTo(headCenter.x + headRadius * 0.72f, headCenter.y - headRadius * 0.45f)
        lineTo(headCenter.x + headRadius * 0.88f, headCenter.y - headRadius * 1.15f - earWiggle)
        lineTo(headCenter.x + headRadius * 0.15f, headCenter.y - headRadius * 0.82f)
        close()
    }

    // Draw outer ears
    drawPath(path = leftEarPath, color = style.furColor)
    drawPath(path = rightEarPath, color = style.furColor)

    // Draw inner ears (pink)
    val leftInnerEarPath = Path().apply {
        moveTo(headCenter.x - headRadius * 0.65f, headCenter.y - headRadius * 0.50f)
        lineTo(headCenter.x - headRadius * 0.78f, headCenter.y - headRadius * 1.02f + earWiggle)
        lineTo(headCenter.x - headRadius * 0.25f, headCenter.y - headRadius * 0.76f)
        close()
    }
    val rightInnerEarPath = Path().apply {
        moveTo(headCenter.x + headRadius * 0.65f, headCenter.y - headRadius * 0.50f)
        lineTo(headCenter.x + headRadius * 0.78f, headCenter.y - headRadius * 1.02f - earWiggle)
        lineTo(headCenter.x + headRadius * 0.25f, headCenter.y - headRadius * 0.76f)
        close()
    }
    drawPath(path = leftInnerEarPath, color = style.innerEarColor)
    drawPath(path = rightInnerEarPath, color = style.innerEarColor)

    // 2. Head (Main soft circle)
    drawCircle(
        color = style.furColor,
        radius = headRadius,
        center = headCenter
    )

    // Subtle fur outline for depth
    drawCircle(
        color = Color(0xFFE2D8CC).copy(alpha = 0.5f),
        radius = headRadius,
        center = headCenter,
        style = Stroke(width = 2.dp.toPx())
    )

    // 3. Cheeks / Blush (Sweet soft pink)
    val blushColor = Color(0xFFFFB4B4).copy(alpha = if (state == CatMascotState.Shy) 0.75f else 0.45f)
    drawCircle(
        color = blushColor,
        radius = headRadius * 0.18f,
        center = Offset(headCenter.x - headRadius * 0.55f, headCenter.y + headRadius * 0.16f)
    )
    drawCircle(
        color = blushColor,
        radius = headRadius * 0.18f,
        center = Offset(headCenter.x + headRadius * 0.55f, headCenter.y + headRadius * 0.16f)
    )

    // 4. Eyes & Expressions based on CatMascotState
    val eyeY = headCenter.y - headRadius * 0.05f
    val leftEyeX = headCenter.x - headRadius * 0.35f
    val rightEyeX = headCenter.x + headRadius * 0.35f
    val eyeRadius = headRadius * 0.12f

    when (state) {
        CatMascotState.Sleeping, CatMascotState.Shy -> {
            // Curved closed happy sleeping / shy eyes (^_^)
            val leftArc = Path().apply {
                moveTo(leftEyeX - eyeRadius * 1.1f, eyeY + eyeRadius * 0.3f)
                quadraticTo(leftEyeX, eyeY - eyeRadius * 0.8f, leftEyeX + eyeRadius * 1.1f, eyeY + eyeRadius * 0.3f)
            }
            val rightArc = Path().apply {
                moveTo(rightEyeX - eyeRadius * 1.1f, eyeY + eyeRadius * 0.3f)
                quadraticTo(rightEyeX, eyeY - eyeRadius * 0.8f, rightEyeX + eyeRadius * 1.1f, eyeY + eyeRadius * 0.3f)
            }
            drawPath(leftArc, style.eyeColor, style = Stroke(width = 3.5.dp.toPx(), cap = StrokeCap.Round))
            drawPath(rightArc, style.eyeColor, style = Stroke(width = 3.5.dp.toPx(), cap = StrokeCap.Round))
        }

        CatMascotState.Happy, CatMascotState.Success, CatMascotState.Excited -> {
            // Big happy curved eyes
            val leftArc = Path().apply {
                moveTo(leftEyeX - eyeRadius * 1.2f, eyeY + eyeRadius * 0.4f)
                quadraticTo(leftEyeX, eyeY - eyeRadius * 1.1f, leftEyeX + eyeRadius * 1.2f, eyeY + eyeRadius * 0.4f)
            }
            val rightArc = Path().apply {
                moveTo(rightEyeX - eyeRadius * 1.2f, eyeY + eyeRadius * 0.4f)
                quadraticTo(rightEyeX, eyeY - eyeRadius * 1.1f, rightEyeX + eyeRadius * 1.2f, eyeY + eyeRadius * 0.4f)
            }
            drawPath(leftArc, style.eyeColor, style = Stroke(width = 4.dp.toPx(), cap = StrokeCap.Round))
            drawPath(rightArc, style.eyeColor, style = Stroke(width = 4.dp.toPx(), cap = StrokeCap.Round))
        }

        CatMascotState.Thinking -> {
            // One eye looking up right, other curious
            drawCircle(color = style.eyeColor, radius = eyeRadius, center = Offset(leftEyeX, eyeY - 2f))
            drawCircle(color = Color.White, radius = eyeRadius * 0.35f, center = Offset(leftEyeX + 2f, eyeY - 4f))

            drawCircle(color = style.eyeColor, radius = eyeRadius, center = Offset(rightEyeX, eyeY - 2f))
            drawCircle(color = Color.White, radius = eyeRadius * 0.35f, center = Offset(rightEyeX + 2f, eyeY - 4f))
        }

        CatMascotState.Worried, CatMascotState.Error -> {
            // Wide concerned eyes with slight sweat mark or downward curve
            drawCircle(color = style.eyeColor, radius = eyeRadius * 1.15f, center = Offset(leftEyeX, eyeY))
            drawCircle(color = Color.White, radius = eyeRadius * 0.4f, center = Offset(leftEyeX - 2f, eyeY - 2f))

            drawCircle(color = style.eyeColor, radius = eyeRadius * 1.15f, center = Offset(rightEyeX, eyeY))
            drawCircle(color = Color.White, radius = eyeRadius * 0.4f, center = Offset(rightEyeX - 2f, eyeY - 2f))
        }

        else -> {
            // Default bright sparkly eyes (Idle, Greeting, Listening)
            drawCircle(color = style.eyeColor, radius = eyeRadius, center = Offset(leftEyeX, eyeY))
            drawCircle(color = Color.White, radius = eyeRadius * 0.42f, center = Offset(leftEyeX - eyeRadius * 0.3f, eyeY - eyeRadius * 0.3f))
            drawCircle(color = Color.White, radius = eyeRadius * 0.18f, center = Offset(leftEyeX + eyeRadius * 0.3f, eyeY + eyeRadius * 0.2f))

            drawCircle(color = style.eyeColor, radius = eyeRadius, center = Offset(rightEyeX, eyeY))
            drawCircle(color = Color.White, radius = eyeRadius * 0.42f, center = Offset(rightEyeX - eyeRadius * 0.3f, eyeY - eyeRadius * 0.3f))
            drawCircle(color = Color.White, radius = eyeRadius * 0.18f, center = Offset(rightEyeX + eyeRadius * 0.3f, eyeY + eyeRadius * 0.2f))
        }
    }

    // 5. Cute Pink Nose & Mouth (ω)
    val noseY = headCenter.y + headRadius * 0.12f
    val nosePath = Path().apply {
        moveTo(headCenter.x, noseY + headRadius * 0.05f)
        lineTo(headCenter.x - headRadius * 0.06f, noseY - headRadius * 0.03f)
        lineTo(headCenter.x + headRadius * 0.06f, noseY - headRadius * 0.03f)
        close()
    }
    drawPath(path = nosePath, color = Color(0xFFF472B6))

    // Mouth
    val mouthY = noseY + headRadius * 0.05f
    val mouthPath = Path().apply {
        moveTo(headCenter.x - headRadius * 0.14f, mouthY + headRadius * 0.08f)
        quadraticTo(headCenter.x - headRadius * 0.07f, mouthY + headRadius * 0.15f, headCenter.x, mouthY + headRadius * 0.03f)
        quadraticTo(headCenter.x + headRadius * 0.07f, mouthY + headRadius * 0.15f, headCenter.x + headRadius * 0.14f, mouthY + headRadius * 0.08f)
    }
    drawPath(
        path = mouthPath,
        color = style.eyeColor,
        style = Stroke(width = 2.5.dp.toPx(), cap = StrokeCap.Round)
    )

    // 6. Whiskers (Left & Right 2 gentle lines)
    val whiskerColor = style.eyeColor.copy(alpha = 0.4f)
    // Left whiskers
    drawLine(
        color = whiskerColor,
        start = Offset(headCenter.x - headRadius * 0.48f, noseY + 2f),
        end = Offset(headCenter.x - headRadius * 0.92f, noseY - 6f),
        strokeWidth = 2.dp.toPx(),
        cap = StrokeCap.Round
    )
    drawLine(
        color = whiskerColor,
        start = Offset(headCenter.x - headRadius * 0.48f, noseY + 12f),
        end = Offset(headCenter.x - headRadius * 0.90f, noseY + 18f),
        strokeWidth = 2.dp.toPx(),
        cap = StrokeCap.Round
    )
    // Right whiskers
    drawLine(
        color = whiskerColor,
        start = Offset(headCenter.x + headRadius * 0.48f, noseY + 2f),
        end = Offset(headCenter.x + headRadius * 0.92f, noseY - 6f),
        strokeWidth = 2.dp.toPx(),
        cap = StrokeCap.Round
    )
    drawLine(
        color = whiskerColor,
        start = Offset(headCenter.x + headRadius * 0.48f, noseY + 12f),
        end = Offset(headCenter.x + headRadius * 0.90f, noseY + 18f),
        strokeWidth = 2.dp.toPx(),
        cap = StrokeCap.Round
    )

    // 7. Theme Accessory: Blue Educational Collar / Bowtie
    val collarY = headCenter.y + headRadius * 0.82f
    val collarWidth = headRadius * 0.72f
    val collarHeight = headRadius * 0.22f
    drawRoundRect(
        color = style.accessoryColor,
        topLeft = Offset(headCenter.x - collarWidth / 2f, collarY),
        size = Size(collarWidth, collarHeight),
        cornerRadius = CornerRadius(8.dp.toPx(), 8.dp.toPx())
    )
    // Golden bell / gem in collar center
    drawCircle(
        color = Color(0xFFFBBF24),
        radius = collarHeight * 0.45f,
        center = Offset(headCenter.x, collarY + collarHeight / 2f)
    )
}
