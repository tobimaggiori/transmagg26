VERSION 1.0 CLASS
BEGIN
  MultiUse = -1  'True
  Persistable = 0  'NotPersistable
  DataBindingBehavior = 0  'vbNone
  DataSourceBehavior  = 0  'vbNone
  MTSTransactionMode  = 0  'NotAnMTSObject
END
Attribute VB_Name = "clsNum2Let"
Attribute VB_GlobalNameSpace = False
Attribute VB_Creatable = True
Attribute VB_PredeclaredId = False
Attribute VB_Exposed = False
Option Explicit

'variables locales que contienen valores de propiedad
Private astrConversor(0 To 2, 1 To 9) As String
Private mvarNumero As Variant ' copia local
Private mstrMoneda As String  ' copia local

Public Property Let Numero(ByVal vData As Variant)
  If IsNumeric(vData) Then
    mvarNumero = vData
  End If
End Property

Public Property Get Numero() As Variant
   Numero = mvarNumero
End Property

Public Function ALetra() As String
   ' Var
   Dim i As Integer
   Dim intProceder As Integer
   Dim intPosNumero As Integer
   Dim intLongNumero As Integer
   Dim strNumero As String
   Dim strLetraNumero As String

   ' Establece los valores iniciales para las Variables
   mvarNumero = Abs(mvarNumero)             'Deberá ser positivo
   strNumero = CStr(Fix(mvarNumero))        'A Cadena
   intLongNumero = Len(strNumero)
   intPosNumero = intLongNumero
   
   ' Cicle por el total de caracteres del número
   For i = 1 To intLongNumero
     intProceder = True
     If (intPosNumero Mod 3) = 1 Then
       If intLongNumero > intPosNumero Then
         Select Case Mid(strNumero, i - 1, 2)
           Case "00"
             If UCase(Right(strLetraNumero, 7)) = "CIENTO " Then
               strLetraNumero = Left(strLetraNumero, Len(strLetraNumero) - 7)
               strLetraNumero = strLetraNumero & "Cien "
             End If
           Case "11"
             strLetraNumero = Left(strLetraNumero, Len(strLetraNumero) - 5)
             strLetraNumero = strLetraNumero & "Once "
             intProceder = False
           Case "12"
             strLetraNumero = Left(strLetraNumero, Len(strLetraNumero) - 5)
             strLetraNumero = strLetraNumero & "Doce "
             intProceder = False
           Case "13"
             strLetraNumero = Left(strLetraNumero, Len(strLetraNumero) - 5)
             strLetraNumero = strLetraNumero & "Trece "
             intProceder = False
           Case "14"
             strLetraNumero = Left(strLetraNumero, Len(strLetraNumero) - 5)
             strLetraNumero = strLetraNumero & "Catorce "
             intProceder = False
           Case "15"
             strLetraNumero = Left(strLetraNumero, Len(strLetraNumero) - 5)
             strLetraNumero = strLetraNumero & "Quince "
             intProceder = False
           Case "16", "17", "18", "19"
             strLetraNumero = Left(strLetraNumero, Len(strLetraNumero) - 2)
             strLetraNumero = strLetraNumero & "ci"
           Case "21" To "29"
             strLetraNumero = Left(strLetraNumero, Len(strLetraNumero) - 2)
             strLetraNumero = strLetraNumero & "i"
           Case Else
             If Val(Mid(strNumero, i, 1)) > 0 And Val(Mid(strNumero, i - 1, 1)) > 0 Then
               strLetraNumero = strLetraNumero & "y "
             End If
         End Select
       End If
     End If

     If Val(Mid(strNumero, i, 1)) > 0 And intProceder Then
       strLetraNumero = strLetraNumero & astrConversor((intPosNumero Mod 3), Val(Mid(strNumero, i, 1))) & " "
     End If

     Select Case intPosNumero
       Case 4
         If Right(strLetraNumero, 9) <> "millones " And Right(strLetraNumero, 13) <> "mil millones " And Right(strLetraNumero, 9) <> "billones " Then
           strLetraNumero = strLetraNumero & "mil "
         End If
       Case 7
         If Right(strLetraNumero, 13) <> "mil millones " And Right(strLetraNumero, 9) <> "billones " Then
           strLetraNumero = strLetraNumero & "millones "
         End If
       Case 10
         If Right(strLetraNumero, 9) <> "billones " Then
            strLetraNumero = strLetraNumero & "millardos "
           'strLetraNumero = strLetraNumero & "mil"
         End If
       Case 13
         strLetraNumero = strLetraNumero & "billones "
       Case Else
     End Select
     intPosNumero = intPosNumero - 1
   Next i

   strLetraNumero = Left(strLetraNumero, 1) & LCase(Mid(strLetraNumero, 2))
   If Numero <> Fix(Numero) Then
     i = (Numero - Fix(Numero)) * 100
     strLetraNumero = strLetraNumero & LCase(mstrMoneda) & Str(i) & "/100"
   Else
     strLetraNumero = strLetraNumero & LCase(mstrMoneda) & " 00/100"
   End If
   
   If UCase(mstrMoneda) = "PESOS" Then
     strLetraNumero = strLetraNumero
   End If
   
   ALetra = strLetraNumero
End Function

Private Sub Asigna()
   ' Asigna los Valores al arreglo astrConversor
   astrConversor(0, 1) = "Ciento"
   astrConversor(0, 2) = "Doscientos"
   astrConversor(0, 3) = "Trescientos"
   astrConversor(0, 4) = "Cuatrocientos"
   astrConversor(0, 5) = "Quinientos"
   astrConversor(0, 6) = "Seiscientos"
   astrConversor(0, 7) = "Setecientos"
   astrConversor(0, 8) = "Ochocientos"
   astrConversor(0, 9) = "Novecientos"
   astrConversor(1, 1) = "Un"
   astrConversor(1, 2) = "Dos"
   astrConversor(1, 3) = "Tres"
   astrConversor(1, 4) = "Cuatro"
   astrConversor(1, 5) = "Cinco"
   astrConversor(1, 6) = "Seis"
   astrConversor(1, 7) = "Siete"
   astrConversor(1, 8) = "Ocho"
   astrConversor(1, 9) = "Nueve"
   astrConversor(2, 1) = "Diez"
   astrConversor(2, 2) = "Veinte"
   astrConversor(2, 3) = "Treinta"
   astrConversor(2, 4) = "Cuarenta"
   astrConversor(2, 5) = "Cincuenta"
   astrConversor(2, 6) = "Sesenta"
   astrConversor(2, 7) = "Setenta"
   astrConversor(2, 8) = "Ochenta"
   astrConversor(2, 9) = "Noventa"
End Sub

Public Property Get Moneda() As String
  Moneda = mstrMoneda
End Property

Public Property Let Moneda(ByVal vNewValue As String)
  mstrMoneda = vNewValue
End Property

Private Sub Class_Initialize()
  Asigna
  mstrMoneda = "CON"
End Sub

Private Sub Class_Terminate()
  Erase astrConversor
End Sub
