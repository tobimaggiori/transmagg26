VERSION 5.00
Object = "{D18BBD1F-82BB-4385-BED3-E9D31A3E361E}#1.0#0"; "KewlButtonz.ocx"
Begin VB.Form RImp_NOPago 
   BackColor       =   &H80000007&
   Caption         =   "Label1"
   ClientHeight    =   3030
   ClientLeft      =   120
   ClientTop       =   450
   ClientWidth     =   6105
   LinkTopic       =   "Form1"
   MDIChild        =   -1  'True
   ScaleHeight     =   3030
   ScaleWidth      =   6105
   Begin VB.TextBox NroLP 
      Height          =   285
      Left            =   2040
      TabIndex        =   6
      Top             =   120
      Width           =   1455
   End
   Begin VB.Frame Frame1 
      BackColor       =   &H80000006&
      Caption         =   "Impresoras"
      ForeColor       =   &H0080C0FF&
      Height          =   1455
      Left            =   120
      TabIndex        =   0
      Top             =   960
      Width           =   3495
      Begin VB.ListBox List1 
         Height          =   1035
         Left            =   240
         TabIndex        =   1
         Top             =   240
         Width           =   3015
      End
   End
   Begin KewlButtonz.KewlButtons Opcion 
      Height          =   495
      Index           =   2
      Left            =   4080
      TabIndex        =   2
      Top             =   1920
      Width           =   1575
      _ExtentX        =   2778
      _ExtentY        =   873
      BTYPE           =   1
      TX              =   "Imprimir Orden de Pago"
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
      MICON           =   "RImp_NOPago.frx":0000
      PICN            =   "RImp_NOPago.frx":001C
      UMCOL           =   -1  'True
      SOFT            =   0   'False
      PICPOS          =   0
      NGREY           =   0   'False
      FX              =   1
      HAND            =   0   'False
      CHECK           =   0   'False
      VALUE           =   0   'False
   End
   Begin KewlButtonz.KewlButtons Opcion 
      Height          =   495
      Index           =   0
      Left            =   4080
      TabIndex        =   3
      Top             =   960
      Width           =   1575
      _ExtentX        =   2778
      _ExtentY        =   873
      BTYPE           =   1
      TX              =   "Imprime Ch. Santa Fe"
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
      MICON           =   "RImp_NOPago.frx":0A2E
      PICN            =   "RImp_NOPago.frx":0A4A
      UMCOL           =   -1  'True
      SOFT            =   0   'False
      PICPOS          =   0
      NGREY           =   0   'False
      FX              =   1
      HAND            =   0   'False
      CHECK           =   0   'False
      VALUE           =   0   'False
   End
   Begin KewlButtonz.KewlButtons Opcion 
      Height          =   495
      Index           =   1
      Left            =   4080
      TabIndex        =   4
      Top             =   1440
      Width           =   1575
      _ExtentX        =   2778
      _ExtentY        =   873
      BTYPE           =   1
      TX              =   "Imprime Ch. Macro"
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
      MICON           =   "RImp_NOPago.frx":145C
      PICN            =   "RImp_NOPago.frx":1478
      UMCOL           =   -1  'True
      SOFT            =   0   'False
      PICPOS          =   0
      NGREY           =   0   'False
      FX              =   1
      HAND            =   0   'False
      CHECK           =   0   'False
      VALUE           =   0   'False
   End
   Begin VB.Label Label1 
      Caption         =   "Label1"
      Height          =   255
      Index           =   1
      Left            =   840
      TabIndex        =   9
      Top             =   600
      Width           =   855
   End
   Begin VB.Label Label1 
      Caption         =   "Label1"
      Height          =   255
      Index           =   0
      Left            =   1800
      TabIndex        =   8
      Top             =   600
      Width           =   3855
   End
   Begin VB.Label Etiqueta 
      BackColor       =   &H00000000&
      Caption         =   "Fletero"
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
      Index           =   0
      Left            =   120
      TabIndex        =   7
      Top             =   600
      Width           =   1815
   End
   Begin VB.Label Etiqueta 
      BackColor       =   &H00000000&
      Caption         =   "Ingrese Nro O. PAgo"
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
      Left            =   120
      TabIndex        =   5
      Top             =   120
      Width           =   1815
   End
End
Attribute VB_Name = "RImp_NOPago"
Attribute VB_GlobalNameSpace = False
Attribute VB_Creatable = False
Attribute VB_PredeclaredId = True
Attribute VB_Exposed = False

 Option Explicit

 Private Sub Form_Load()
     Obtener_Impresoras
     List1.ListIndex = 0
     Label1(0) = ""
     Label1(1) = ""
     NroLP = ""
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

Private Sub NroLP_LostFocus()
Set rsEncabOP = DB.OpenRecordset("Select * From EncabOP Where NroOP = " & NroLP & "")
If Not rsEncabOP.EOF And Not rsEncabOP.BOF Then
    Set rsFleteros = DB.OpenRecordset("Select * From Fleteros Where CodFlet = " & rsEncabOP!codprov & "")
    Label1(1) = rsFleteros!CodFlet
    Label1(0) = rsFleteros!DescFlet
Else
    MsgBox "Debe completar nro de Orden de Pago"
End If
End Sub

Private Sub Opcion_Click(Index As Integer)
If List1.ListIndex <> -1 Then
        Call Establecer(List1.Text)
       Respuesta = MsgBox("Se usará la impresora: " & _
                Printer.DeviceName & " para imprimir el texto", vbCritical + vbYesNo)
End If
If Respuesta = vbYes Then
    VNROOP = NroLP
    If Index = 0 Then
        Call ImprimeCH(NroLP, Label1(0))
    ElseIf Index = 1 Then
        Call ImprimeCHMacro(NroLP, Label1(0))
    Else
        Call VistaOP(NroLP)
    End If
End If
End Sub


