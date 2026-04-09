Attribute VB_Name = "bas"

Option Explicit
  
' Declaraciones del Api
'******************************************************************************
' Establece el Hook
Private Declare Function SetWindowsHookEx Lib "user32" Alias "SetWindowsHookExA" ( _
    ByVal idHook As Long, _
    ByVal lpfn As Long, _
    ByVal hmod As Long, _
    ByVal dwThreadId As Long) As Long
  
' Destruye el Hook
Private Declare Function UnhookWindowsHookEx Lib "user32" ( _
    ByVal hHook As Long) As Long
  
' Cambia el texto al botón del Msgbox
Private Declare Function SetDlgItemText Lib "user32" Alias "SetDlgItemTextA" ( _
    ByVal hDlg As Long, _
    ByVal nIDDlgItem As Long, _
    ByVal lpString As String) As Long
  
  
'Contantes
    Private Const WH_CBT = 5
    Private Const HCBT_ACTIVATE = 5
  
'Enumeraciones para el botón que se va a modificar
    Enum Ebuttons
        ' Para el Botón OK
        [OK] = 1
        ' Para el Botón Cancelar
        [Cancel] = 2
        ' Para el Botón Abortar
        [ABORT] = 3
        ' Para el Botón Reintentar
        [RETRY] = 4
        ' Para el Botón Ignorar
        [Ignore] = 5
        ' Para el Botón Si
        [YES] = 6
        ' Para el Botón No
        [NO] = 7
    End Enum
  
    ' variables que toman los valores de la función _
     MsgBoxExText y los usa dentro del HOOK
       
    Dim m_Boton As Long ' Elbotón que se va a modificar
    Dim m_Texto_Boton As String ' Texto del botón
  
    ' Mantiene el valor para luego finalizar el Hook
    Private Id_Hook As Long
  
    Function MsgBoxExText(Prompt As String, _
                      Buttons As VbMsgBoxStyle, _
                      Title As String, _
                      El_Boton As Ebuttons, _
                      TextButton As String) As VbMsgBoxResult
           
        m_Boton = El_Boton
        m_Texto_Boton = TextButton
        Hook
       
        MsgBoxExText = MsgBox(Prompt, Buttons, Title)
       
  
End Function
  
Private Sub Hook()
       
    ' Inicia el Hook
    Id_Hook = SetWindowsHookEx(WH_CBT, AddressOf winProc, 0, App.ThreadID)
         
End Sub
' Procedimiento que intercepta los mensajes
Public Function winProc( _
    ByVal uMsg As Long, _
    ByVal wParam As Long, _
    ByVal lParam As Long) As Long
       
    Dim ret As Long
  
    If uMsg = HCBT_ACTIVATE Then
       
        ' Cambia el texto
        ret = SetDlgItemText(wParam, m_Boton, m_Texto_Boton)
       
        ' Elimina el Hook
        ret = UnhookWindowsHookEx(Id_Hook)
        m_Texto_Boton = vbNullString
       
    End If
  
    winProc = 0
       
End Function

