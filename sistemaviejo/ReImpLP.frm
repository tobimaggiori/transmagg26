VERSION 5.00
Object = "{D18BBD1F-82BB-4385-BED3-E9D31A3E361E}#1.0#0"; "kewlbuttonz.ocx"
Begin VB.Form ReImpLP 
   BackColor       =   &H80000007&
   Caption         =   "ReeImpresión Liquido Producto"
   ClientHeight    =   2985
   ClientLeft      =   60
   ClientTop       =   450
   ClientWidth     =   3825
   LinkTopic       =   "Form1"
   MDIChild        =   -1  'True
   ScaleHeight     =   2985
   ScaleWidth      =   3825
   Begin VB.Frame Frame1 
      BackColor       =   &H80000006&
      Caption         =   "Impresoras"
      ForeColor       =   &H0080C0FF&
      Height          =   1455
      Left            =   240
      TabIndex        =   4
      Top             =   600
      Width           =   3495
      Begin VB.ListBox List1 
         Height          =   1035
         Left            =   240
         TabIndex        =   5
         Top             =   240
         Width           =   3015
      End
   End
   Begin VB.TextBox Text1 
      Height          =   285
      Left            =   2160
      TabIndex        =   2
      Text            =   "Text1"
      Top             =   240
      Width           =   975
   End
   Begin KewlButtonz.KewlButtons Opcion 
      Height          =   495
      Index           =   1
      Left            =   0
      TabIndex        =   0
      Top             =   2280
      Width           =   1215
      _ExtentX        =   2143
      _ExtentY        =   873
      BTYPE           =   1
      TX              =   "Imprimir Liq. Pod."
      ENAB            =   -1  'True
      BeginProperty FONT {0BE35203-8F91-11CE-9DE3-00AA004BB851} 
         Name            =   "MS Sans Serif"
         Size            =   8.25
         Charset         =   0
         Weight          =   700
         Underline       =   0   'False
         Italic          =   0   'False
         Strikethrough   =   0   'False
      EndProperty
      COLTYPE         =   2
      FOCUSR          =   -1  'True
      BCOL            =   4210752
      BCOLO           =   4210752
      FCOL            =   12632256
      FCOLO           =   4210752
      MCOL            =   4210752
      MPTR            =   1
      MICON           =   "ReImpLP.frx":0000
      PICN            =   "ReImpLP.frx":001C
      UMCOL           =   -1  'True
      SOFT            =   0   'False
      PICPOS          =   0
      NGREY           =   0   'False
      FX              =   1
      HAND            =   0   'False
      CHECK           =   0   'False
      VALUE           =   0   'False
   End
   Begin KewlButtonz.KewlButtons prueba 
      Height          =   495
      Index           =   0
      Left            =   1320
      TabIndex        =   3
      Top             =   2280
      Width           =   1095
      _ExtentX        =   1931
      _ExtentY        =   873
      BTYPE           =   1
      TX              =   "Cheque Santa Fe"
      ENAB            =   -1  'True
      BeginProperty FONT {0BE35203-8F91-11CE-9DE3-00AA004BB851} 
         Name            =   "MS Sans Serif"
         Size            =   8.25
         Charset         =   0
         Weight          =   700
         Underline       =   0   'False
         Italic          =   0   'False
         Strikethrough   =   0   'False
      EndProperty
      COLTYPE         =   2
      FOCUSR          =   -1  'True
      BCOL            =   4210752
      BCOLO           =   4210752
      FCOL            =   12632256
      FCOLO           =   4210752
      MCOL            =   4210752
      MPTR            =   1
      MICON           =   "ReImpLP.frx":0A2E
      PICN            =   "ReImpLP.frx":0A4A
      UMCOL           =   -1  'True
      SOFT            =   0   'False
      PICPOS          =   0
      NGREY           =   0   'False
      FX              =   1
      HAND            =   0   'False
      CHECK           =   0   'False
      VALUE           =   0   'False
   End
   Begin KewlButtonz.KewlButtons prueba 
      Height          =   495
      Index           =   1
      Left            =   2520
      TabIndex        =   6
      Top             =   2280
      Width           =   1215
      _ExtentX        =   2143
      _ExtentY        =   873
      BTYPE           =   1
      TX              =   "Cheques MACRO"
      ENAB            =   -1  'True
      BeginProperty FONT {0BE35203-8F91-11CE-9DE3-00AA004BB851} 
         Name            =   "MS Sans Serif"
         Size            =   8.25
         Charset         =   0
         Weight          =   700
         Underline       =   0   'False
         Italic          =   0   'False
         Strikethrough   =   0   'False
      EndProperty
      COLTYPE         =   2
      FOCUSR          =   -1  'True
      BCOL            =   4210752
      BCOLO           =   4210752
      FCOL            =   12632256
      FCOLO           =   4210752
      MCOL            =   4210752
      MPTR            =   1
      MICON           =   "ReImpLP.frx":145C
      PICN            =   "ReImpLP.frx":1478
      UMCOL           =   -1  'True
      SOFT            =   0   'False
      PICPOS          =   0
      NGREY           =   0   'False
      FX              =   1
      HAND            =   0   'False
      CHECK           =   0   'False
      VALUE           =   0   'False
   End
   Begin VB.Label Etiqueta 
      BackColor       =   &H00000000&
      Caption         =   "Nro Liq. Prod."
      BeginProperty Font 
         Name            =   "MS Sans Serif"
         Size            =   8.25
         Charset         =   0
         Weight          =   700
         Underline       =   0   'False
         Italic          =   0   'False
         Strikethrough   =   0   'False
      EndProperty
      ForeColor       =   &H0080C0FF&
      Height          =   255
      Index           =   1
      Left            =   840
      TabIndex        =   1
      Top             =   240
      Width           =   1215
   End
End
Attribute VB_Name = "ReImpLP"
Attribute VB_GlobalNameSpace = False
Attribute VB_Creatable = False
Attribute VB_PredeclaredId = True
Attribute VB_Exposed = False

 Private Sub Form_Load()
     Obtener_Impresoras
     List1.ListIndex = 0
     Text1 = ""
 End Sub

 Public Function Obtener_Impresoras()
     Dim i As Integer
     ' recorre las impresoras del sistema y las añade a la lista
     For i = 0 To Printers.Count - 1
         List1.AddItem Printers(i).DeviceName
     Next

 End Function

Public Function Establecer(Nombre_Impresora As String)
Dim Prt As Printer
     ' Establece la impresora que se utilizará para imprimir
For Each Prt In Printers
    If Prt.DeviceName = Nombre_Impresora Then
        Set Printer = Prt
    End If
Next
End Function
Private Sub Opcion_Click(Index As Integer)
If List1.ListIndex <> -1 Then
        Call Establecer(List1.Text)
        Respuesta = MsgBox("Se usará la impresora: " & _
                Printer.DeviceName & " para imprimir el texto", vbCritical + vbYesNo)
End If
If Respuesta = vbYes Then
Call Imprime_LP(Text1)
End If
End Sub

Private Sub prueba_Click(Index As Integer)
Set rsEncabLP = db.OpenRecordset("Select * From EncabLP Where NroLP = " & Text1 & "")
Set rsFleteros = db.OpenRecordset("Select * from Fleteros Where CodFlet = " & rsEncabLP!CodFlet & "")
If List1.ListIndex <> -1 Then
        Call Establecer(List1.Text)
       Respuesta = MsgBox("Se usará la impresora: " & _
                Printer.DeviceName & " para imprimir el texto", vbCritical + vbYesNo)
End If
If Respuesta = vbYes Then
If Index = 0 Then
    Call ImprimeCH(Text1, rsFleteros!DescFlet)
Else
    Call ImprimeCHMacro(Text1, rsFleteros!DescFlet)
End If
End If
End Sub
