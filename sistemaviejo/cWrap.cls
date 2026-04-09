VERSION 1.0 CLASS
BEGIN
  MultiUse = -1  'True
  Persistable = 0  'NotPersistable
  DataBindingBehavior = 0  'vbNone
  DataSourceBehavior  = 0  'vbNone
  MTSTransactionMode  = 0  'NotAnMTSObject
END
Attribute VB_Name = "cWrap"
Attribute VB_GlobalNameSpace = False
Attribute VB_Creatable = False
Attribute VB_PredeclaredId = False
Attribute VB_Exposed = False
'------------------------------------------------------------------------------
' cWrap                                                             (13/Jun/98)
' Clase para efectuar "cortes" de palabras de forma apropiada
'
' Revisado el  4/Ene/1999
' Revisado el 20/Ago/2001   Nueva función: LoopPropperWrap
' Revisado el 08/Oct/2002   Algunos ajustes cuando la cadena contiene intro
'
' ©Guillermo 'guille' Som, 1998-2002
'
' Esta clase tiene los siguientes métodos (funciones)
'   Justificar      Justifica la cadena,
'                   añadiendo espacios hasta conseguir la longitud deseada
'   PropperJust     Justifica la cadena según los caracteres indicados
'                   Esto sólo será útil si el resultado se muestra con fuente
'                   no proporcional
'   PropperWrap     Es como las siguientes, pero se debe especificar por dónde
'                   empezar a contar los caracteres.
'   PropperLeft     como Left$(Cadena, longitud) pero sin cortar palabras
'   PropperMid      como Mid$(Cadena, longitud) pero sin cortar palabras
'   PropperRight    como Right$(Cadena, longitud) pero sin cortar palabras
'
'   Separadores     Para indicar los separadores a usar
'------------------------------------------------------------------------------
Option Explicit

Const cSeparadores = " ªº\!|@#$%&/()=?¿'¡[]*+{}<>,.-;:_"
Private sSeparadores As String
'Alineación para usar con PropperWrap
Public Enum ePropperWrapConstants
    pwLeft = 0
    pwMid = 1
    pwRight = 2
'    pwIzquierda = 0
'    pwCentro = 1
'    pwDerecha = 2
End Enum

Public Function PropperWrap(ByVal sCadena As String, _
                            ByVal nCaracteres As Long, _
                            Optional ByVal DesdeDonde As ePropperWrapConstants = pwLeft) As String
Attribute PropperWrap.VB_Description = "Devuelve la cadena que habría que imprimir para mostrar los caracteres indicados, sin cortar una palabra"
Attribute PropperWrap.VB_HelpID = 21120
    'Devuelve la cadena que habría que imprimir para mostrar los
    'caracteres indicados, sin cortar una palabra.
    'Esto es para los casos en los que se quiera usar:
    'Left$(sCadena,nCaracteres) o Mid$/Right$(sCadena,nCaracteres)
    'pero sin cortar una palabra
    Dim i As Long
    Dim sChar As String
    '
    i = InStr(sCadena, vbCrLf)
    If i > 0 And i < nCaracteres Then
        sCadena = Left$(sCadena, i + 1)
    ElseIf nCaracteres > Len(sCadena) Then
        i = InStr(sCadena, vbCrLf)
        If i Then
            sCadena = Left$(sCadena, i - 1)
        End If
        'PropperWrap = sCadena
    Else
        For i = nCaracteres To 1 Step -1
            If InStr(sSeparadores, Mid$(sCadena, i, 1)) Then
                'Si se especifica desde la izquierda
                If DesdeDonde = pwLeft Then
                    sCadena = Left$(sCadena, i)
                Else
                'lo mismo da desde el centro que desde la derecha
                    sCadena = Mid$(sCadena, i + 1)
                End If
                Exit For
            End If
        Next
    End If
    PropperWrap = sCadena
End Function

Public Function PropperRight(ByVal sCadena As String, ByVal nCaracteres As Long) As String
Attribute PropperRight.VB_Description = "Es como usar: Right$(sCadena,nCaracteres) pero sin cortar ninguna palabra"
Attribute PropperRight.VB_HelpID = 21120
    PropperRight = PropperWrap(sCadena, nCaracteres, pwRight)
End Function

Public Function PropperMid(ByVal sCadena As String, ByVal nCaracteres As Long, Optional ByVal RestoNoUsado As Long) As String
Attribute PropperMid.VB_Description = "Es como usar: Mid$(sCadena,nCaracteres) pero sin cortar ninguna palabra"
Attribute PropperMid.VB_HelpID = 21120
    PropperMid = PropperWrap(sCadena, nCaracteres, pwMid)
End Function

Public Function PropperLeft(ByVal sCadena As String, ByVal nCaracteres As Long) As String
Attribute PropperLeft.VB_Description = "Es como usar: Left$(sCadena,nCaracteres) pero sin cortar ninguna palabra"
Attribute PropperLeft.VB_HelpID = 21120
    PropperLeft = PropperWrap(sCadena, nCaracteres, pwLeft)
End Function

Public Function PropperJust(ByVal Cadena As String, _
                        Optional ByVal Longitud As Long = 70&, _
                        Optional ByVal Justificar As Boolean = True) As String
Attribute PropperJust.VB_Description = "Justifica la cadena según los caracteres indicados"
Attribute PropperJust.VB_HelpID = 21120
    '--------------------------------------------------------------------------
    ' Justifica la cadena según los caracteres indicados            ( 3/Ene/99)
    ' Esto sólo será útil si el resultado se muestra con fuente no proporcional
    ' Valores de entrada:
    '   Cadena      Cadena a manipular
    '   Longitud    Longitud de cada línea, por defecto 70 caracteres
    '   Justificar  Si se justifica, rellenando con espacios, por defecto Si
    ' Devuelve:
    '   La cadena una vez manipulada
    '--------------------------------------------------------------------------
    Dim sLinea As String
    Dim sTmp As String
    Dim sTmp2 As String
    Dim i As Long
    
    Do
        'Los cambios de línea se consideran por separado
        i = InStr(Cadena, vbCrLf)
        If i Then
            sTmp = Left$(Cadena, i - 1)
            Cadena = Mid$(Cadena, i + 2)
        Else
            sTmp = Cadena
            Cadena = ""
        End If
        Do
            sLinea = Me.PropperWrap(sTmp, Longitud, pwLeft)
            If sTmp = sLinea Then
                'no justificar cuando es el final de línea
                sTmp = ""
            Else
                sTmp = Mid$(sTmp, Len(sLinea) + 1)
                If Justificar Then
                    sLinea = Me.Justificar(sLinea, Longitud)
                End If
            End If
            If Not sTmp2 = "" Then
                sTmp2 = sTmp2 & sLinea
            Else
                sTmp2 = sTmp2 & sLinea & vbCrLf
            End If
        Loop While Len(sTmp)
    Loop While Len(Cadena)
    PropperJust = sTmp2
End Function

Public Function Justificar(ByVal Cadena As String, _
                           Optional ByVal Longitud As Long = 70&) As String
Attribute Justificar.VB_Description = "Justifica la cadena, añadiendo espacios hasta conseguir la longitud deseada"
Attribute Justificar.VB_HelpID = 21120
    ' Justifica la cadena, añadiendo espacios hasta conseguir la longitud deseada
    Dim i As Long
    Dim j As Long
    Dim k As Long
    Dim Hallado As Boolean
    Dim n As Long
    
    Cadena = Trim$(Cadena)
    If Len(Cadena) < Longitud Then
        k = 1
        n = 0
        '
        Hallado = False
        Do
            For i = 1 To Len(sSeparadores)
                j = InStr(k, Cadena, Mid$(sSeparadores, i, 1))
                If j Then
                    Cadena = Left$(Cadena, j) & " " & Mid$(Cadena, j + 1)
                    k = j + 1
                    'Buscar el siguiente caracter que no sea un separador
                    For j = k + 1 To Len(Cadena)
                        If InStr(sSeparadores, Mid$(Cadena, j, 1)) = 0 Then
                            k = j
                            Exit For
                        End If
                    Next
                    Hallado = True
                    n = n + 1
                    Exit For
                Else
                    k = 1
                    Hallado = False
                End If
            Next
            If Not Hallado Then
                k = 1
                If n = 0 Then
                    Cadena = Cadena & " "
                End If
            End If
        Loop While Len(Cadena) < Longitud
    End If
    Justificar = Left$(Cadena, Longitud)
End Function

Private Sub Class_Initialize()
    'sSeparadores = cSeparadores & vbCr & vbLf & vbTab & Chr$(34)
    ' Añadir los intros y tabuladores antes del resto de caracteres (08/Oct/02)
    sSeparadores = vbCr & vbLf & vbTab & cSeparadores & Chr$(34)
End Sub

Public Property Get Separadores() As String
Attribute Separadores.VB_Description = "Para indicar los separadores a usar como separadores de palabras"
Attribute Separadores.VB_HelpID = 21120
    Separadores = sSeparadores
End Property

Public Property Let Separadores(ByVal NewSeparadores As String)
    sSeparadores = NewSeparadores
End Property

Public Function LoopPropperWrap(Optional ByVal sCadena As String, _
                    Optional ByVal nCaracteres As Long = 70&, _
                    Optional ByVal DesdeDonde As ePropperWrapConstants = pwLeft) As String
    ' Repite la justificación hasta que la cadena esté vacia        (20/Ago/01)
    ' Devolviendo cada vez el número de caracteres indicados
    Static sCadenaCopia As String
    Static nCaracteresCopia As Long
    Static DesdeDondeCopia As ePropperWrapConstants
    Dim s As String
    '
    ' Si la cadena es una cadena vacía, es que se continua "partiendo"
    ' sino, es la primera llamada
    If Len(sCadena) Then
        sCadenaCopia = sCadena
        nCaracteresCopia = nCaracteres
        DesdeDondeCopia = DesdeDonde
    Else
        ' Asignar los valores que había antes
        sCadena = sCadenaCopia
        nCaracteres = nCaracteresCopia
        DesdeDonde = DesdeDondeCopia
    End If
    '
    ' ESTO NO ES NECESARIO
    ' (además de que se queda "colgao")
'    ' ya que los cambios de líneas se consideran separadores
'    ' Si hay un vbCrLf, mostrar hasta ese caracter
'    Dim i As Long
'    i = InStr(sCadena, vbCrLf)
'    If i Then
'        If i < nCaracteres Then
'            nCaracteres = i '- 1
'            sCadena = Left$(sCadena, i - 1) & " " & Mid$(sCadena, i)
'        End If
'    End If
    '
    '
    s = PropperWrap(sCadena, nCaracteres, DesdeDonde)
    sCadenaCopia = Mid$(sCadena, Len(s) + 1)
    ' Si termina con vbCrLf quitárselo...                           (08/Oct/02)
    If Right$(s, 2) = vbCrLf Then
        s = Left$(s, Len(s) - 2)
    End If
    '
    LoopPropperWrap = s
End Function
