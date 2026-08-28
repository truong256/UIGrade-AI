package com.uigrade.ai.presentation.navigation

import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.ViewModel
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.lifecycle.viewModelScope
import com.uigrade.ai.domain.model.UserRole
import com.uigrade.ai.domain.usecase.GetCurrentUserUseCase
import com.uigrade.ai.ui.components.LoadingScreen
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

sealed interface RoleGuardState {
    data object Loading : RoleGuardState
    data object Allowed : RoleGuardState
    data class Denied(val actualRole: UserRole?) : RoleGuardState
}

@HiltViewModel
class RoleGuardViewModel @Inject constructor(
    private val getCurrentUserUseCase: GetCurrentUserUseCase
) : ViewModel() {
    private val _state = MutableStateFlow<RoleGuardState>(RoleGuardState.Loading)
    val state: StateFlow<RoleGuardState> = _state.asStateFlow()

    fun verify(requiredRole: UserRole) {
        if (_state.value != RoleGuardState.Loading) return
        viewModelScope.launch {
            val actual = runCatching { getCurrentUserUseCase()?.role }.getOrNull()
            _state.value = if (actual == requiredRole) {
                RoleGuardState.Allowed
            } else {
                RoleGuardState.Denied(actual)
            }
        }
    }
}

@Composable
fun RoleGuard(
    requiredRole: UserRole,
    onDenied: (UserRole?) -> Unit,
    modifier: Modifier = Modifier,
    viewModel: RoleGuardViewModel = hiltViewModel(),
    content: @Composable () -> Unit
) {
    val state by viewModel.state.collectAsStateWithLifecycle()
    LaunchedEffect(requiredRole) { viewModel.verify(requiredRole) }
    when (val current = state) {
        RoleGuardState.Loading -> LoadingScreen(modifier)
        RoleGuardState.Allowed -> content()
        is RoleGuardState.Denied -> {
            LaunchedEffect(current.actualRole) { onDenied(current.actualRole) }
            LoadingScreen(modifier)
        }
    }
}
