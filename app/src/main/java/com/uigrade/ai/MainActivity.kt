package com.uigrade.ai

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import com.uigrade.ai.presentation.navigation.UIGradeNavGraph
import com.uigrade.ai.ui.theme.UIGradeAITheme
import dagger.hilt.android.AndroidEntryPoint

/**
 * Single Activity host for the entire Compose navigation graph.
 */
@AndroidEntryPoint
class MainActivity : ComponentActivity() {

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        setContent {
            UIGradeAITheme {
                UIGradeNavGraph()
            }
        }
    }
}
